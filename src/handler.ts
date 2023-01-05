import { Telegraf } from 'telegraf'
import { Book } from './book'
import { drawProgressChart } from './chart'

export const handleText = async (bot: Telegraf) => {
  bot.on('text', async (ctx) => {
    try {
      console.log('Incoming message:', ctx.message.text)
      const pageNumber = parseInt(ctx.message.text)
      if (!isNaN(pageNumber)) {
        let currentBook = await Book.getCurrentBook()
        if (currentBook) {
          if (!currentBook.totalPages) {
            const message = `Your current book _${currentBook.title}_ has no total pages number set\\. Log into notion\\.so and set Pages property for the book\\.`
            ctx.telegram.sendMessage(ctx.message.chat.id, message, {
              parse_mode: 'MarkdownV2',
            })
            return
          }
          await currentBook.createBookmark(pageNumber)
          await currentBook.refresh()
          ctx.telegram.sendMessage(
            ctx.message.chat.id,
            await generateConfirmMessage(currentBook, pageNumber),
            {
              parse_mode: 'MarkdownV2',
            }
          )
        } else {
          ctx.telegram.sendMessage(ctx.message.chat.id, replyNoCurrentBook())
        }
      } else if (ctx.message.text.toLowerCase() === 'progress') {
        const book = await Book.getCurrentBook()
        if (book) {
          const progress = await book!.getProgress()
          const image = await drawProgressChart(progress)
          ctx.telegram.sendPhoto(ctx.message.chat.id, {
            source: image,
          })
        } else {
          ctx.telegram.sendMessage(ctx.message.chat.id, replyNoCurrentBook())
        }
      } else {
        ctx.telegram.sendMessage(
          ctx.message.chat.id,
          'Please specify a page number.'
        )
      }
    } catch (err) {
      console.error(err)
    }
  })
}

async function generateConfirmMessage(currentBook: Book, pageNumber: number) {
  let message = `Bookmarking page ${pageNumber} of _${currentBook.title}_\\.`
  const percentCompleted = await currentBook.getPercentCompleted()
  message += `\nYou are at *${percentCompleted}%* of ${currentBook.totalPages} pages\\.`
  return message
}

function replyNoCurrentBook() {
  return "You currently have no books in progress. Log into notion.so and mark a book as 'In Progress'."
}
