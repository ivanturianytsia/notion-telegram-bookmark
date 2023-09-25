import { createBots } from './bots'
import { launchServer } from './server'
import { DOMAIN, ENABLED_BOTS } from './constants'

const bots = createBots(ENABLED_BOTS)

if (DOMAIN) {
  launchServer(bots)
} else {
  bots.forEach((bot) => {
    bot.launch()
  })
  launchServer()
}
