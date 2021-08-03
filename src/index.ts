import { Telegraf } from 'telegraf'
import { Client } from '@notionhq/client'

const BOOK_DATABASE_ID = 'c50dd28e9a3a420b991261359efc205d'
const READING_SESSIONS_DATABASE_ID = '9339fc34a20d401881f43a33570936f5'

if (!process.env.BOT_TOKEN || !process.env.NOTION_TOKEN) {
  throw new Error('BOT_TOKEN or NOTION_TOKEN not set')
}

const bot = new Telegraf(process.env.BOT_TOKEN)
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

bot.on('text', async ctx => {
  if (!isNaN(parseInt(ctx.message.text))) {
    const currentBooks = await notion.databases.query({
      database_id: BOOK_DATABASE_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'In Progress',
        },
      },
    })
    if (currentBooks.results.length > 0) {
      const book = currentBooks.results[0]
      const title = book.properties.Name.type === 'title' ? `'${book.properties.Name.title.map(clause => clause.plain_text).join()}'` : 'the current book'
      ctx.telegram.sendMessage(ctx.message.chat.id, `Bookmarking page #${ctx.message.text} of ${title}.`)
    } else {
      ctx.telegram.sendMessage(ctx.message.chat.id, 'You currently have no books in progress. Log into notion.so and mark a book as \'In Progress\'.')
    }
  } else {
    ctx.telegram.sendMessage(ctx.message.chat.id, 'Please specify a page number.')
  }
})

bot.launch()
