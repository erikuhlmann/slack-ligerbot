const GoogleSpreadsheet = require('google-spreadsheet')
 
let doc
let sheet

module.exports = {
  init: function() {
    console.log('Logging in to Drive...')
    return new Promise(function(resolve) {
      let creds = require('./slack-ligerbot.json')
    
      doc = new GoogleSpreadsheet(creds.sheet_key)
      doc.useServiceAccountAuth(creds, function() {
        console.log('Loading directory...')
        doc.getInfo(function(err, info) {
          console.log('Loaded doc: '+info.title+' by '+info.author.email)
          sheet = info.worksheets[0]
          console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount)
          resolve()
        })
      })
    })
  },
  
  lookup: function(name) {
    return new Promise(function(resolve) {
      if(!doc || !sheet) {
        resolve('Error: Directory isn\'t loaded yet')
        return
      }
      
      let nameParts = name.trim().split(/\s+/g)
      if(nameParts.length == 0 || nameParts[0].length == 0) {
        resolve('I don\'t know who to look up!')
        return
      }
      let part1 = nameParts[0].toLowerCase()
      let part2 = nameParts.length > 1 ? nameParts[1].toLowerCase() : null
      
      if(part1 == 'ligerbot' || part2 == 'ligerbot') {
        resolve('That\'s me!')
        return
      }
      
      console.log('Directory request', part1, part2)
      
      sheet.getRows({
        offset: 1
      }, function( err, rows ){
        if(err) {
          resolve('Google Drive error')
          return
        }
        console.log('Read', rows.length, 'rows')
 
        let response = ''
        
        for(let row of rows) {
          if(row.firstname.toLowerCase() == part1 || row.lastname.toLowerCase() == part1) {
            if((part2 && (row.firstname.toLowerCase() == part2 || row.lastname.toLowerCase() == part2)) || !part2) {
              response += `Found: ${row.firstname} ${row.lastname}\nEmail: ${row.email}\nPhone: ${row.phone}\nEmergency phone: ${row.emergencyphone}\nAddress: ${row.address} ${row.city} ${row.state} ${row.zipcode}\n\n`
            }
          }
        }
        
        if(response == '') resolve('Couldn\'t find that person in the directory')
        else resolve(response)
      })
    })
  }
}