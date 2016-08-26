require('dotenv').config()
const SlackBot = require('slackbots')

const directory = require('./directory')
try {
  directory.init()
} catch(e) {
  console.error(e)
}

const chief = require('./chief')

const bot = new SlackBot({
  token: process.env.SLACK_TOKEN,
  name: 'ligerbot'
})

function isChatMessage(message) {
  return message.type === 'message' && Boolean(message.text)
}

function isFromSelf(message) {
  return message.user === bot.user.id
}

function asMention(userId) {
  // slack's mention syntax under the hood is weird
  return `<@${userId}>`
}

function isMentioning(message) {
  return message.text.indexOf(asMention(bot.user.id)) > -1
}

function getChannelById(channelId) {
  return bot.channels.filter(item => item.id === channelId)[0]
}

function getResponse(text) {
  text = text.replace(asMention(bot.user.id), '').trim().toLowerCase()
  if(text.startsWith('say')) {
    return Promise.resolve(text.substring(3).trim())
  } else if(text.indexOf('contact info') > -1 || text.indexOf('find') > -1 || text.indexOf('who is') > -1) {
    let name = text.replace(/get|contact|info|for|find|who|is/g, '').trim()
    return directory.lookup(name)
  } else if(text.match(/chief/)) {
    let category = text.replace(/chief|delphi|new|posts|in|section/g, '').trim()
    return chief(category.length ? category : null)
  }
  return Promise.reject('No response')
}

bot.on('start', function() {
  bot.user = bot.users.filter(user => user.name === bot.name)[0]

  bot.on('message', function(data) {
    console.log(data)
    if(isChatMessage(data) && !isFromSelf(data) && isMentioning(data)) {
      getResponse(data.text).then(function(response) {
        bot.postMessage(data.channel, response, {as_user: true})
      })
    }
  })
})