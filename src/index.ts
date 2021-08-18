import { Telegraf } from 'telegraf'
import { Book } from './book'

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
        ctx.telegram.sendMessage(ctx.message.chat.id, 'You currently have no books in progress. Log into notion.so and mark a book as \'In Progress\'.')
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
  const progress = await currentBook.getProgress()
  message += `\nYou are at *${progress}%* of ${currentBook.totalPages} pages\\.`
  return message
}
