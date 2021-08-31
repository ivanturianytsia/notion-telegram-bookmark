import { Telegraf } from 'telegraf'
import { handleText } from './handler'

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set.')
}

const bot = new Telegraf(process.env.BOT_TOKEN)

handleText(bot)

if (process.env.WEBHOOK_HOST && process.env.PORT) {
  bot.launch({
    webhook: {
      domain: process.env.WEBHOOK_HOST,
      port: parseInt(process.env.PORT),
      hookPath: '/webhook',
    }
  })
} else {
  bot.launch()
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
