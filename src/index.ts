import { config } from 'dotenv'
import { createBots } from './bots'
import { launchServer } from './server'

config()

const bots = createBots()

if (process.env.DOMAIN) {
  launchServer(bots)
} else {
  bots.forEach((bot) => {
    bot.launch()
  })
  launchServer()
}
