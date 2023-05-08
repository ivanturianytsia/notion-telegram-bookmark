import { Handler } from 'express'
import { Telegraf } from 'telegraf'

export class Bot {
  private bot: Telegraf

  constructor(public id: string, botToken: string, handleText: TextHandler) {
    if (!botToken) {
      throw new Error(`Bot token for ${this.id} is not set.`)
    }

    this.bot = new Telegraf(botToken)

    this.bot.on('text', async (ctx) => {
      const response = await handleText({
        chatId: ctx.message.chat.id,
        messageText: ctx.message.text,
      })

      if (response && response.text) {
        ctx.telegram.sendMessage(ctx.message.chat.id, response.text)
      }
      if (response && response.formattedText) {
        ctx.telegram.sendMessage(ctx.message.chat.id, response.formattedText, {
          parse_mode: 'MarkdownV2',
        })
      }
      if (response && response.img) {
        ctx.telegram.sendPhoto(ctx.message.chat.id, {
          source: response.img,
        })
      }
    })

    process.once('SIGINT', () => this.bot.stop('SIGINT'))
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
  }

  launch() {
    this.bot.launch()
    console.log(`Bot ${this.id} is ready! (polling mode)`)
  }

  handleWebhook(webhookPath: string): Handler {
    if (!process.env.DOMAIN) {
      throw new Error(`DOMAIN for ${this.id} is not set.`)
    }
    const port = !isNaN(parseInt(process.env.WEBHOOK_PORT!))
      ? parseInt(process.env.WEBHOOK_PORT!)
      : 3001

    console.log(`Bot ${this.id} is starting! (webhook mode)`)
    this.bot.telegram.setWebhook(`https://${process.env.DOMAIN}/bot/webhook`)
    return this.bot.webhookCallback(webhookPath)
  }
}

export type TextHandler = (
  context: Context
) => Promise<TelegramResponse | undefined>

export interface TelegramResponse {
  text?: string
  formattedText?: string
  img?: Buffer
}

export interface Context {
  chatId: number
  messageText: string
}
