import { Book } from './notion'
import { TextHandler, TelegramResponse } from '../bot'
import { parsePageNumber } from '../../helpers'

export const NOTION_BOOKMARK_BOT_NAME = 'notion-bookmark'

export const notionBookmarkBotHandler: TextHandler = async ({
  chatId,
  messageText,
}) => {
  try {
    const pageNumber = parsePageNumber(messageText)
    const command = messageText.toLowerCase().trim()
    if (pageNumber) {
      return handlePageNumber(pageNumber)
    } else if (['stat', 'stats'].includes(command)) {
      return handleStats()
    } else if (messageText.length > 5) {
      return handleQuote(messageText)
    }

    return replyNotValid()
  } catch (err) {
    console.error(err)
  }
}

async function handlePageNumber(pageNumber: number) {
  let currentBook = await Book.getCurrentBook()
  if (currentBook) {
    if (!currentBook.totalPages) {
      return replyNoTotalPages(currentBook)
    }
    if (pageNumber > currentBook.totalPages) {
      return replyPageOutOfRange(currentBook)
    }
    await currentBook.createBookmark(pageNumber)

    if (pageNumber === currentBook.totalPages) {
      return replyCompleted(currentBook)
    }

    return replyBookmarked(pageNumber)
  }

  return replyNoCurrentBook()
}

async function handleStats() {
  let currentBook = await Book.getCurrentBook()

  if (currentBook) {
    return replyStats(currentBook)
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
    message += `\nNow at *${currentBook.percentCompleted}%* of ${currentBook.totalPages} pages\\.`
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

function replyPageOutOfRange(currentBook: Book): TelegramResponse {
  const message = `The provided number is out of range\\. Your current book _${currentBook.title}_ has ${currentBook.totalPages} pages in total\\.`
  return { formattedText: message }
}

async function replyCompleted(currentBook: Book): Promise<TelegramResponse> {
  const rawAvg = await currentBook.getAveragePerDay()
  const rawStartDay = await currentBook.getStartDay()
  const readingDays = await currentBook.getReadingDays()

  const averagePerDay = rawAvg.toFixed(1).toString().replace('.', '\\.')
  const startDay = rawStartDay.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  let message = `Congratulations, you completed _${currentBook.title}_\\!`
  message += `\nYou started on *${startDay}* and read for *${readingDays}* days`
  message += ` with an average of *${averagePerDay}* pages per day\\. `
  return { formattedText: message }
}

function replyNoCurrentBook() {
  return {
    formattedText:
      "You currently have no books in progress\\. Log into [notion\\.so](https://notion\\.so) and mark a book as 'In Progress'\\.",
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

async function replyStats(currentBook: Book): Promise<TelegramResponse> {
  const rawAvg = await currentBook.getAveragePerDay()
  const rawStartDay = await currentBook.getStartDay()
  const readingDays = await currentBook.getReadingDays()
  const daysToFinish = await currentBook.getDaysToFinish()

  const averagePerDay = rawAvg.toFixed(1).toString().replace('.', '\\.')
  const startDay = rawStartDay.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  let message = `Stats for _${currentBook.title}_`
  message += `\nStart date: *${startDay}*`
  message += `\nReading days: *${readingDays}* days`
  message += `\nAvg pace: *${averagePerDay}* pages/day`
  message += `\nProgress: *${currentBook.percentCompleted}%*`
  message += `\nUntil completion: *${daysToFinish}* days`
  return { formattedText: message }
}
