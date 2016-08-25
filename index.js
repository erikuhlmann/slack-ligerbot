// npm install slackbots 

const SlackBot = require('slackbots')

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
  text = text.replace(asMention(bot.user.id), '').trim()
  if(text.startsWith('say')) {
    return text.substring(3).trim()
  }
  return false
}

bot.on('start', function() {
  bot.user = bot.users.filter(user => user.name === bot.name)[0]

  bot.on('message', function(data) {
    console.log(data)
    if(isChatMessage(data) && !isFromSelf(data) && isMentioning(data)) {
      let response = getResponse(data.text)
      if(response) {
        bot.postMessage(data.channel, response, {as_user: true})
      }
    }
  })
})