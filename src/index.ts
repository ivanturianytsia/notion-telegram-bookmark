import { config } from 'dotenv'
import { createBots } from './bots'
import { launchServer } from './server'

config()

const bots = createBots(process.env.ENABLED_BOTS?.split(','))

if (process.env.DOMAIN) {
  launchServer(bots)
} else {
  bots.forEach((bot) => {
    bot.launch()
  })
  launchServer()
}
