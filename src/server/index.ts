import express, { Handler } from 'express'
import { Telegraf } from 'telegraf'
import { Bot } from '../bot'

export const launchServer = (bot?: Bot) => {
  const port = process.env.PORT || 3000

  const app = express()

  if (bot) {
    app.use(bot.handleWebhook('/bot/webhook'))
  }

  app.get('/', (req, res) => {
    res.send('The bot is working.')
  })

  app.listen(port, () => {
    console.log(`Express app listening on http://localhost:${port}`)
  })
}
