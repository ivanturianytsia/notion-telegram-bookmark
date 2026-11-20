import path from 'path'
import { createHmac, timingSafeEqual } from 'crypto'
import express from 'express'
import cookieParser from 'cookie-parser'
import { engine } from 'express-handlebars'

import { Bot } from '../bots/bot'
import { IS_PRODUCTION, PASSWORD, PORT, TAG } from '../constants'
import { Book } from '../bots/notion-bookmark/Book'
import { parsePageNumber } from '../helpers'

export const launchServer = (bots?: Bot[]) => {
  const port = PORT || 3000

  const app = express()

  app.disable('x-powered-by')
  // nginx on the same host terminates TLS and forwards requests.
  app.set('trust proxy', 'loopback')

  app.engine('handlebars', engine())
  app.set('view engine', 'handlebars')
  app.set('views', path.join(__dirname, '../views'))

  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  if (bots) {
    bots.forEach((bot) => {
      app.use(bot.handleWebhook(`/bot/webhook/${bot.id}`))
    })
  }

  app.use('/public', express.static(path.join(__dirname, '../public')))

  app.get('/', async (req, res) => {
    try {
      let books:
        | {
            id: string
            title: string
            totalPages: number
            bookmark: number
            percentCompleted: number
            pageOptions: number[]
          }[]
        | null = null
      if (isAuthenticated(req)) {
        const bookResults = await Book.getCurrentBooks()
        await Promise.all(
          bookResults.map(async (book) => {
            const bookmark = (await book.getBookmark()) || 0
            if (!books) {
              books = []
            }
            books.push({
              id: book.id,
              title: book.title,
              totalPages: book.totalPages,
              bookmark,
              percentCompleted: Math.round((bookmark * 100) / book.totalPages),
              pageOptions: Array.from(
                { length: Math.min(50, book.totalPages - bookmark) },
                (_, i) => bookmark + 1 + i,
              ),
            })
          }),
        )
      }

      res.render('index', {
        tag: TAG || 'unknown',
        books,
      })
    } catch (err: any) {
      console.error(err)
      renderError(res, err.message)
    }
  })

  app.get('/login', (req, res) => logIn(req.query.password, res))

  app.post('/record', async (req, res) => {
    try {
      if (!isAuthenticated(req)) {
        throw new Error('Access denied.')
      }

      if (typeof req.body.page !== 'string') {
        throw new Error('Invalid page number.')
      }

      if (typeof req.body.book !== 'string') {
        throw new Error('Invalid book ID.')
      }

      const pageNumber = parsePageNumber(req.body.page)

      if (pageNumber === null) {
        throw new Error('Invalid page number.')
      }

      let book = await Book.getBookbyId(req.body.book)

      if (!book) {
        throw new Error('Invalid book ID.')
      }

      if (!book.totalPages) {
        throw new Error('Total pages is not set for the book.')
      }

      if (pageNumber > book.totalPages) {
        throw new Error('Page number exceeds total pages.')
      }

      await book.createBookmark(pageNumber)

      res.redirect('/')
    } catch (err: any) {
      console.error(err)
      renderError(res, err.message)
    }
  })

  app.listen(port, () => {
    console.log(`Express app listening on http://localhost:${port}`)
  })

  function logIn(password: unknown, res: express.Response) {
    if (
      !PASSWORD ||
      typeof password !== 'string' ||
      !safeEqual(password, PASSWORD)
    ) {
      renderError(res, 'Access denied.')
      return
    }
    res.cookie(SESSION_COOKIE_NAME, sessionToken(PASSWORD), {
      maxAge: SESSION_MAX_AGE_MS,
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
    })
    res.redirect('/')
  }

  function renderError(res: express.Response, message: string) {
    res.render('error', {
      errorMessage: message,
    })
  }
}

const SESSION_COOKIE_NAME = 'auth'
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14

// The session cookie holds an HMAC of the password, never the password itself.
function sessionToken(password: string) {
  return createHmac('sha256', password).update('ntbb-session').digest('hex')
}

function isAuthenticated(req: express.Request) {
  const cookieValue = req.cookies[SESSION_COOKIE_NAME]
  if (!PASSWORD || typeof cookieValue !== 'string') {
    return false
  }
  return safeEqual(cookieValue, sessionToken(PASSWORD))
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer)
}
