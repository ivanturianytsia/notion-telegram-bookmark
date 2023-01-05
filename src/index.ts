import { Telegraf } from 'telegraf'
import express from 'express'
import { config } from 'dotenv'
import { handleText } from './handler'

config()

// Telegram bot init

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set.')
}

const bot = new Telegraf(process.env.BOT_TOKEN)

handleText(bot)

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

console.log('Bot is ready!')

// Express app init

const port = process.env.PORT || 80

const app = express()

app.get('/', (req, res) => {
  res.send('The bot is working.')
})

app.listen(port, () => {
  console.log(`Express app listening on http://localhost:${port}`)
})
