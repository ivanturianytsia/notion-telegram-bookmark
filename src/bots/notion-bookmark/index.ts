import { Book } from './notion'
import { drawProgressChart } from './chart'
import { TextHandler } from '../bot'

const PROGRESS_ENABLED = false

export const notionBookmarkBotHandler: TextHandler = async ({
  chatId,
  messageText,
}) => {
  try {
    console.log('Incoming message:', messageText)
    const pageNumber = parseInt(messageText)
    if (!isNaN(pageNumber)) {
      let currentBook = await Book.getCurrentBook()
      if (currentBook) {
        if (!currentBook.totalPages) {
          const message = `Your current book _${currentBook.title}_ has no total pages number set\\. Log into notion\\.so and set Pages property for the book\\.`
          return { formattedText: message }
        }
        await currentBook.createBookmark(pageNumber)
        currentBook = (await Book.getCurrentBook())!

        return {
          formattedText: await generateConfirmMessage(currentBook, pageNumber),
        }
      }

      return replyNoCurrentBook()
    } else if (PROGRESS_ENABLED && messageText.toLowerCase() === 'progress') {
      const book = await Book.getCurrentBook()
      if (book) {
        const progress = await book!.getProgress()
        const image = await drawProgressChart(progress)

        return {
          img: image,
        }
      }

      return replyNoCurrentBook()
    } else if (messageText.length > 5) {
      let currentBook = await Book.getCurrentBook()

      if (currentBook) {
        await currentBook.appendQuote(messageText)

        return {
          formattedText: 'Quote saved\\.',
        }
      }

      return replyNoCurrentBook()
    }

    return {
      formattedText: 'Please specify a page number or send a quote\\.',
    }
  } catch (err) {
    console.error(err)
  }
}

async function generateConfirmMessage(currentBook: Book, pageNumber: number) {
  let message = `Bookmarking page ${pageNumber} of _${currentBook.title}_\\.`
  const percentCompleted = await currentBook.getPercentCompleted()
  message += `\nYou are at *${percentCompleted}%* of ${currentBook.totalPages} pages\\.`
  return message
}

function replyNoCurrentBook() {
  return {
    formattedText:
      "You currently have no books in progress. Log into notion.so and mark a book as 'In Progress'.",
  }
}
