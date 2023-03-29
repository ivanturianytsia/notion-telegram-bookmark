import { Telegraf } from 'telegraf'
import { handleText } from './handler'

export const launchBot = async () => {
  if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not set.')
  }

  const bot = new Telegraf(process.env.BOT_TOKEN)

  bot.on('text', async (ctx) => {
    const response = await handleText({
      chatId: ctx.message.chat.id,
      messageText: ctx.message.text,
    })

    if (response && response.text) {
      ctx.telegram.sendMessage(ctx.message.chat.id, response.text, {
        parse_mode: 'MarkdownV2',
      })
    }
    if (response && response.img) {
      ctx.telegram.sendPhoto(ctx.message.chat.id, {
        source: response.img,
      })
    }
  })

  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))

  if (process.env.DOMAIN) {
    const port = !isNaN(parseInt(process.env.WEBHOOK_PORT!))
      ? parseInt(process.env.WEBHOOK_PORT!)
      : 3001
    await bot.launch({
      webhook: {
        domain: process.env.DOMAIN,
        port,
        hookPath: '/bot/webhook',
      },
    })
    console.log(`Bot is ready! (listening on port ${port})`)
  } else {
    await bot.launch()
    console.log('Bot is ready! (polling mode)')
  }
}

export interface TelegramResponse {
  text?: string
  img?: Buffer
}

export interface Context {
  chatId: number
  messageText: string
}
