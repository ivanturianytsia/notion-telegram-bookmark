import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import { engine } from 'express-handlebars'

import { Bot } from '../bots/bot'
import { PASSWORD, PORT, TAG } from '../constants'
import { Book } from '../bots/notion-bookmark/notion'
import { parsePageNumber } from '../helpers'

export const launchServer = (bots?: Bot[]) => {
  const port = PORT || 3000

  const app = express()

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

  app.get('/', async (req, res) => {
    try {
      const authCookie = req.cookies.auth

      let books: Book[] | null = null
      if (authCookie === PASSWORD) {
        books = await Book.getCurrentBooks()
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

  app.get('/login', (req, res) => {
    if (req.query.password !== PASSWORD) {
      renderError(res, 'Access denied.')
      return
    }
    res.cookie('auth', req.query.password)
    res.redirect('/')
  })

  app.post('/record', async (req, res) => {
    try {
      if (req.cookies.auth !== PASSWORD) {
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

  function renderError(res: express.Response, message: string) {
    res.render('error', {
      errorMessage: message,
    })
  }
}
