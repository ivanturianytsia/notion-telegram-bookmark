import { Telegraf } from 'telegraf'
import { Client } from '@notionhq/client'
import { Page, RichText } from '@notionhq/client/build/src/api-types'

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
  try {
    const pageNumber = parseInt(ctx.message.text)
    if (!isNaN(pageNumber)) {
      const currentBooks = await getCurrentBooks()
      if (currentBooks.results.length > 0) {
        const book = currentBooks.results[0]
        await createBookmark(book, pageNumber)
        const progress = getProgress(book, pageNumber)
        ctx.telegram.sendMessage(ctx.message.chat.id, `Bookmarking page ${pageNumber} of ${getBookTitle(book)}.${progress ? `\nYou are at ${progress}%` : ''}`)
      } else {
        ctx.telegram.sendMessage(ctx.message.chat.id, 'You currently have no books in progress. Log into notion.so and mark a book as \'In Progress\'.')
      }
    } else {
      ctx.telegram.sendMessage(ctx.message.chat.id, 'Please specify a page number.')
    }
  } catch (err) {
    console.error(err)
  }
})

bot.launch()

function getCurrentBooks() {
  return notion.databases.query({
    database_id: BOOK_DATABASE_ID,
    filter: {
      property: 'Status',
      select: {
        equals: 'In Progress',
      },
    },
  })
}

function getBookTitle(book: Page) {
  return book.properties.Name.type === 'title'
    ? `"${getPlainText(book.properties.Name.title)}"`
    : 'the current book'
}

function getPlainText(richText: RichText[]) {
  return richText.map(clause => clause.plain_text).join()
}

function createBookmark(book: Page, pageNumber: number) {
  return notion.pages.create({
    parent: {
      database_id: READING_SESSIONS_DATABASE_ID,
    },
    properties: {
      Name: {
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: '',
            }
          },
        ],
      },
      'Date': {
        type: 'date',
        date: {
          start: (new Date()).toISOString()
        }
      },
      'End Page': {
        type: 'number',
        number: pageNumber,
      },
      'Book': {
        type: 'relation',
        relation: [{
          id: book.id,
        }],
      } as any,
    },
  });
}

function getProgress(book: Page, pageNumber: number) {
  const pageTotal = getBookPageTotal(book)
  return pageTotal ? Math.ceil(pageNumber * 100 / pageTotal) : null
}

function getBookPageTotal(book: Page) {
  return book.properties.Pages.type === 'number'
    ? book.properties.Pages.number
    : 0
}
