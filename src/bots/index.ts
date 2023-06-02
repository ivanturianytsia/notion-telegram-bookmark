import { Bot } from './bot'
import { fluentBotHandler, FLUENT_BOT_NAME } from './fluent'
import { GratitudeBot } from './gratitude'
import {
  notionBookmarkBotHandler,
  NOTION_BOOKMARK_BOT_NAME,
} from './notion-bookmark'

export function createBots(enabledBots?: string[]): Bot[] {
  console.log(
    enabledBots
      ? `Enabled bots are: ${enabledBots.join(', ')}.`
      : 'All bots are enabled.'
  )
  const bots = [
    new Bot(
      NOTION_BOOKMARK_BOT_NAME,
      process.env.BOT_TOKEN!,
      notionBookmarkBotHandler
    ),
    new Bot(FLUENT_BOT_NAME, process.env.FLUENT_BOT_TOKEN!, fluentBotHandler),
    new GratitudeBot(process.env.GRATITUDE_BOT_TOKEN!),
  ]

  return bots.filter((bot) =>
    enabledBots ? enabledBots.includes(bot.id) : true
  )
}
