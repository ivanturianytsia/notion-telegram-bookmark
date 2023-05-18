import express from 'express'
import { Bot } from '../bots/bot'

export const launchServer = (bots?: Bot[]) => {
  const port = process.env.PORT || 3000

  const app = express()

  if (bots) {
    bots.forEach((bot) => {
      app.use(bot.handleWebhook(`/bot/webhook/${bot.id}`))
    })
  }

  app.get('/', (req, res) => {
    res.send('The bot is working!')
  })

  app.listen(port, () => {
    console.log(`Express app listening on http://localhost:${port}`)
  })
}
