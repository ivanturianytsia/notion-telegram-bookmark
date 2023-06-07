import { config } from 'dotenv'
import { createBots } from './bots'
import { launchServer } from './server'
import { isProduction } from './constants'

config()

const bots = createBots(
  isProduction ? undefined : process.env.ENABLED_BOTS?.split(',')
)

if (process.env.DOMAIN) {
  launchServer(bots)
} else {
  bots.forEach((bot) => {
    bot.launch()
  })
  launchServer()
}
