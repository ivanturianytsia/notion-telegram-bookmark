import { config } from 'dotenv'
config()

export const IS_PRODUCTION = process.env.ENV === 'production'

export const BOT_TOKEN = process.env.BOT_TOKEN
export const FLUENT_BOT_TOKEN = process.env.FLUENT_BOT_TOKEN
export const GRATITUDE_BOT_TOKEN = process.env.GRATITUDE_BOT_TOKEN

export const OPENAI_TOKEN = process.env.OPENAI_TOKEN
export const NOTION_TOKEN = process.env.NOTION_TOKEN

export const ENABLED_BOTS =
  process.env.ENABLED_BOTS && process.env.ENABLED_BOTS !== 'all'
    ? process.env.ENABLED_BOTS?.split(',')
    : 'all'

export const DOMAIN = process.env.DOMAIN
export const WEBHOOK_PORT = process.env.WEBHOOK_PORT
export const PORT = process.env.PORT
export const TAG = process.env.TAG
export const USE_CHAT_GPT = false
