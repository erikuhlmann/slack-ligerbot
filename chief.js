const FeedParser = require('feedparser')
const request = require('request')
const striptags = require('striptags')

let lastDate = new Date(0)

function sanitize(str) {
  str = striptags(str)
  str = str.replace(/[\*\_>`~]/g, '')
  str = str.replace(/\s+/g, ' ')
  return str
}

module.exports = function(category) {
  return new Promise(function(resolve, reject) {
    let req = request('http://chiefdelphi.com/forum/external.php')
    let feedparser = new FeedParser();
    
    req.on('error', function (error) {
      resolve('Error')
    })
    req.on('response', function (res) {
      let stream = this
      
      if (res.statusCode != 200) {
        resolve('Error')
      } else {
        stream.pipe(feedparser)
      }
    })
    
    feedparser.on('error', function(error) {
      resolve('Error')
    })
    
    let cachedLastDate = new Date(lastDate.getTime()),
      foundPosts = false,
      response = `*New topics${category ? ' in ' + category : ''}:*\n\n`,
      limit = 5,
      count = 0
    
    feedparser.on('readable', function() {
      let stream = this,
        meta = this.meta,
        item
      
      while (item = stream.read()) {
        if(item.date > lastDate) {
          lastDate = new Date(item.date.getTime())
        }
        if(count >= limit) continue
        if(category) {
          let matches = false
          for(let c of item.categories) {
            if(c.toLowerCase().indexOf(category) > -1) {
              matches = true
              break
            }
          }
          if(!matches) continue
        }
        if(item.date > cachedLastDate) {
          foundPosts = true
          response += `*${item.title}* in *${item.categories.join(', ')}*\n${item.link}\n_${sanitize(item.summary)}_\n\n`
          count++
        }
      }
    })
    
    feedparser.on('end', function(){
      if(!foundPosts) {
        response = 'No new posts'
      }
      resolve(response)
    })
  })
}