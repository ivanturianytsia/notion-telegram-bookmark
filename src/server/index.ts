import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import { engine } from 'express-handlebars'

import { Bot } from '../bots/bot'
import { PASSWORD, PORT, TAG } from '../constants'
import { Book } from '../bots/notion-bookmark/notion'

export const launchServer = (bots?: Bot[]) => {
  const port = PORT || 3000

  const app = express()

  app.use(cookieParser())
  app.engine('handlebars', engine())
  app.set('view engine', 'handlebars')
  app.set('views', path.join(__dirname, '../views'))

  if (bots) {
    bots.forEach((bot) => {
      app.use(bot.handleWebhook(`/bot/webhook/${bot.id}`))
    })
  }

  app.get('/', async (req, res) => {
    const authCookie = req.cookies.auth

    let books: Book[] | null = null
    if (authCookie === PASSWORD) {
      books = await Book.getCurrentBooks()
    }

    res.render('index', {
      tag: TAG || 'unknown',
      books,
    })
  })

  app.get('/login', (req, res) => {
    if (req.query.password !== PASSWORD) {
      res.send('Invalid password')
      return
    }
    res.cookie('auth', req.query.password)
    res.redirect('/')
  })

  app.listen(port, () => {
    console.log(`Express app listening on http://localhost:${port}`)
  })
}
