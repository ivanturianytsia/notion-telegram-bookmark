import { config } from 'dotenv'
import { createBot } from './bot'
import { launchServer } from './server'

config()

const bot = createBot()

if (process.env.DOMAIN) {
  launchServer(bot)
} else {
  bot.launch()
  launchServer()
}
