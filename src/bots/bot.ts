import { createHash } from 'crypto'
import { Handler } from 'express'
import { Telegraf } from 'telegraf'
import { WEBHOOK_PORT, DOMAIN } from '../constants'

export class Bot {
  public bot: Telegraf
  private webhookSecretToken: string

  constructor(
    public id: string,
    botToken: string,
    handleText?: TextHandler,
  ) {
    if (!botToken) {
      throw new Error(`Bot token for ${this.id} is not set.`)
    }

    this.bot = new Telegraf(botToken)
    // Telegram sends this value in the X-Telegram-Bot-Api-Secret-Token header
    // of each webhook call, so requests that do not come from Telegram are rejected.
    // It is derived from the bot token, so no extra secret has to be configured.
    this.webhookSecretToken = createHash('sha256')
      .update(`webhook-secret:${botToken}`)
      .digest('hex')

    // Without this, an error in any update handler crashes the whole process.
    this.bot.catch((err, ctx) => {
      console.error(
        `Bot ${this.id} failed to handle update ${ctx.update.update_id}:`,
        err,
      )
    })

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
              },
            )
            console.log(
              new Date(),
              'Response (formatted):',
              response.formattedText,
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
    this.bot.telegram
      .setWebhook(`https://${DOMAIN}/bot/webhook/${this.id}`, {
        secret_token: this.webhookSecretToken,
      })
      .catch((err) => {
        // Log only the message: the error object includes the secret token.
        console.error(`Failed to set webhook for bot ${this.id}:`, err?.message)
      })
    const webhookCallback = this.bot.webhookCallback(webhookPath, {
      secretToken: this.webhookSecretToken,
    })
    // An error outside the update handlers (for example a failed getMe call)
    // would otherwise be an unhandled rejection that crashes the process.
    return (req, res, next) => {
      Promise.resolve(webhookCallback(req, res, next)).catch((err) => {
        console.error(`Bot ${this.id} webhook failed:`, err?.message)
        if (!res.headersSent) {
          res.sendStatus(500)
        }
      })
    }
  }

  init() {}
}

export type TextHandler = (
  context: Context,
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
