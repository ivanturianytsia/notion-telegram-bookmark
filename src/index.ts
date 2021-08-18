import { Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'
import { Book } from './book'
import { drawProgressChart } from './chart'

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set.')
}

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', async ctx => {
  try {
    const pageNumber = parseInt(ctx.message.text)
    if (!isNaN(pageNumber)) {
      let currentBook = await Book.getCurrentBook()
      if (currentBook) {
        await currentBook.createBookmark(pageNumber)
        await currentBook.refresh()
        ctx.telegram.sendMessage(ctx.message.chat.id, await generateConfirmMessage(currentBook, pageNumber), {
          parse_mode: 'MarkdownV2'
        })
      } else {
        ctx.telegram.sendMessage(ctx.message.chat.id, replyNoCurrentBook())
      }
    } if (ctx.message.text.toLowerCase() === 'progress') {
      const book = await Book.getCurrentBook()
      if (book) {
        const progress = await book!.getProgress()
        const image = await drawProgressChart(progress)
        ctx.telegram.sendPhoto(ctx.message.chat.id, {
          source: image
        })
      } else {
        ctx.telegram.sendMessage(ctx.message.chat.id, replyNoCurrentBook())
      }
    } else {
      ctx.telegram.sendMessage(ctx.message.chat.id, 'Please specify a page number.')
    }
  } catch (err) {
    console.error(err)
  }
})

if (process.env.WEBHOOK_HOST && process.env.PORT) {
  bot.launch({
    webhook: {
      domain: process.env.WEBHOOK_HOST,
      port: parseInt(process.env.PORT),
      hookPath: '/webhook',
    }
  })
} else {
  bot.launch()
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

async function generateConfirmMessage (currentBook: Book, pageNumber: number) {
  let message = `Bookmarking page ${pageNumber} of _${currentBook.title}_\\.`
  const percentCompleted = await currentBook.getPercentCompleted()
  message += `\nYou are at *${percentCompleted}%* of ${currentBook.totalPages} pages\\.`
  return message
}

function replyNoCurrentBook () {
  return 'You currently have no books in progress. Log into notion.so and mark a book as \'In Progress\'.'
}
