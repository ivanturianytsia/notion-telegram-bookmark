import { Bot } from './bot'
import { fluentBotHandler } from './fluent'
import { notionBookmarkBotHandler } from './notion-bookmark'

export function createBots(): Bot[] {
  return [
    new Bot(
      'notion-bookmark',
      process.env.BOT_TOKEN!,
      notionBookmarkBotHandler
    ),
    new Bot('fluent', process.env.FLUENT_BOT_TOKEN!, fluentBotHandler),
  ]
}
