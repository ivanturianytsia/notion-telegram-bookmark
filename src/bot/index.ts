import { Handler } from 'express'
import { Telegraf } from 'telegraf'
import { handleText } from './handler'

export const createBot = () => {
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

  return {
    launch: () => {
      bot.launch()
      console.log('Bot is ready! (polling mode)')
    },
    handleWebhook: (webhookPath: string): Handler => {
      if (!process.env.DOMAIN) {
        throw new Error('DOMAIN is not set.')
      }
      const port = !isNaN(parseInt(process.env.WEBHOOK_PORT!))
        ? parseInt(process.env.WEBHOOK_PORT!)
        : 3001

      console.log(`Bot is starting! (webhook mode)`)
      bot.telegram.setWebhook(`https://${process.env.DOMAIN}/bot/webhook`)
      return bot.webhookCallback(webhookPath)
    },
  }
}

export type Bot = ReturnType<typeof createBot>

export interface TelegramResponse {
  text?: string
  img?: Buffer
}

export interface Context {
  chatId: number
  messageText: string
}
