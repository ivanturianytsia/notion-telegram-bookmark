import { BOT_TOKEN, FLUENT_BOT_TOKEN, GRATITUDE_BOT_TOKEN } from '../constants'
import { Bot } from './bot'
import { fluentBotHandler, FLUENT_BOT_NAME } from './fluent'
import { GratitudeBot } from './gratitude'
import {
  notionBookmarkBotHandler,
  NOTION_BOOKMARK_BOT_NAME,
} from './notion-bookmark'

export function createBots(enabledBots: string[] | 'all'): Bot[] {
  console.log(
    enabledBots === 'all'
      ? 'All bots are enabled.'
      : `Enabled bots are: ${enabledBots.join(', ')}.`
  )
  const bots = [
    new Bot(NOTION_BOOKMARK_BOT_NAME, BOT_TOKEN!, notionBookmarkBotHandler),
    new Bot(FLUENT_BOT_NAME, FLUENT_BOT_TOKEN!, fluentBotHandler),
    new GratitudeBot(GRATITUDE_BOT_TOKEN!),
  ]

  return bots.filter((bot) =>
    enabledBots === 'all' ? true : enabledBots.includes(bot.id)
  )
}
