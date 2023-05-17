import { Book } from './notion'
import { drawProgressChart } from './chart'
import { TextHandler, TelegramResponse } from '../bot'

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
          return replyNoTotalPages(currentBook)
        }
        await currentBook.createBookmark(pageNumber)

        return replyBookmarked(pageNumber)
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

        return replyQuoteSaved()
      }

      return replyNoCurrentBook()
    }

    return replyNotValid()
  } catch (err) {
    console.error(err)
  }
}

async function replyBookmarked(pageNumber: number): Promise<TelegramResponse> {
  const currentBook = (await Book.getCurrentBook())! // We reload the book to get the latest data
  const percentCompleted = await currentBook.getPercentCompleted()

  let message = `Bookmarking page ${pageNumber} of _${currentBook.title}_\\.`
  message += `\nYou are at *${percentCompleted}%* of ${currentBook.totalPages} pages\\.`

  return {
    formattedText: message,
  }
}

function replyNoTotalPages(currentBook: Book): TelegramResponse {
  const message = `Your current book _${currentBook.title}_ has no total pages number set\\. Log into notion\\.so and set Pages property for the book\\.`
  return { formattedText: message }
}

function replyNoCurrentBook() {
  return {
    formattedText:
      "You currently have no books in progress. Log into notion.so and mark a book as 'In Progress'.",
  }
}

function replyQuoteSaved() {
  return {
    formattedText: 'Quote saved\\.',
  }
}

function replyNotValid() {
  return {
    formattedText: 'Please specify a page number or send a quote\\.',
  }
}
