import express from 'express'

export const launchServer = () => {
  const port = process.env.PORT || 3000

  const app = express()

  app.get('/', (req, res) => {
    res.send('The bot is working.')
  })

  app.listen(port, () => {
    console.log(`Express app listening on http://localhost:${port}`)
  })
}
