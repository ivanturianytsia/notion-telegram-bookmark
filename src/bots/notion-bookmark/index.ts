import { Book } from './notion'
import { TextHandler, TelegramResponse } from '../bot'

const PROGRESS_ENABLED = false

export const NOTION_BOOKMARK_BOT_NAME = 'notion-bookmark'

export const notionBookmarkBotHandler: TextHandler = async ({
  chatId,
  messageText,
}) => {
  try {
    const pageNumber = parsePageNumber(messageText)
    if (pageNumber) {
      return handlePageNumber(pageNumber)
    } else if (messageText.length > 5) {
      return handleQuote(messageText)
    }

    return replyNotValid()
  } catch (err) {
    console.error(err)
  }
}

function parsePageNumber(messageText: string) {
  const isPageNumber = /^\d+$/.test(messageText)
  return isPageNumber ? parseInt(messageText) : null
}

async function handlePageNumber(pageNumber: number) {
  let currentBook = await Book.getCurrentBook()
  if (currentBook) {
    if (!currentBook.totalPages) {
      return replyNoTotalPages(currentBook)
    }
    await currentBook.createBookmark(pageNumber)

    return replyBookmarked(pageNumber)
  }

  return replyNoCurrentBook()
}

async function handleQuote(messageText: string) {
  let currentBook = await Book.getCurrentBook()

  if (currentBook) {
    await currentBook.appendQuote(messageText)

    return replyQuoteSaved()
  }

  return replyNoCurrentBook()
}

async function replyBookmarked(pageNumber: number): Promise<TelegramResponse> {
  const currentBook = (await Book.getCurrentBook())! // We reload the book to get the latest data

  let message = `Marking page ${pageNumber} of _${currentBook.title}_\\.`

  try {
    const percentCompleted = await currentBook.getPercentCompleted()
    message += `\nNow at *${percentCompleted}%* of ${currentBook.totalPages} pages\\.`
  } catch (err) {
    console.error('Error calculating percent completed:', err)
  }

  try {
    const daysToFinish = await currentBook.getDaysToFinish()
    message += `\n\\~${daysToFinish} days to go\\.`
  } catch (err) {
    console.error('Error calculating days to finish:', err)
  }

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
