import { Handler } from 'express'
import { Telegraf } from 'telegraf'
import { WEBHOOK_PORT, DOMAIN } from '../constants'

export class Bot {
  public bot: Telegraf

  constructor(public id: string, botToken: string, handleText?: TextHandler) {
    if (!botToken) {
      throw new Error(`Bot token for ${this.id} is not set.`)
    }

    this.bot = new Telegraf(botToken)

    if (handleText) {
      this.bot.on('text', (ctx) => {
        console.log(new Date(), 'Incoming message:', ctx.message.text)
        handleText({
          chatId: ctx.message.chat.id,
          messageText: ctx.message.text,
        }).then((response) => {
          if (response?.text) {
            ctx.telegram.sendMessage(ctx.message.chat.id, response.text)
            console.log(new Date(), 'Response:', response.text)
          }
          if (response?.formattedText) {
            ctx.telegram.sendMessage(
              ctx.message.chat.id,
              response.formattedText,
              {
                parse_mode: 'MarkdownV2',
              }
            )
            console.log(
              new Date(),
              'Response (formatted):',
              response.formattedText
            )
          }
          if (response?.img) {
            ctx.telegram.sendPhoto(ctx.message.chat.id, {
              source: response.img,
            })
            console.log(new Date(), 'Responded with image.')
          }
        })
      })
    }

    process.once('SIGINT', () => this.bot.stop('SIGINT'))
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
  }

  launch() {
    this.init()
    this.bot.launch()
    console.log(`Bot ${this.id} is ready! (polling mode)`)
  }

  handleWebhook(webhookPath: string): Handler {
    if (!DOMAIN) {
      throw new Error(`DOMAIN for ${this.id} is not set.`)
    }

    console.log(`Bot ${this.id} is starting! (webhook mode)`)
    this.init()
    this.bot.telegram.setWebhook(`https://${DOMAIN}/bot/webhook/${this.id}`)
    return this.bot.webhookCallback(webhookPath)
  }

  init() {}
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
