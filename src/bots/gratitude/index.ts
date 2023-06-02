import { Bot } from '../bot'
import { getCompletion } from '../../clients/openai'

export const GRATITUDE_BOT_NAME = 'gratitude'

interface User {
  chatId: number
  name: string
  records: UserRecord[]
}

interface UserRecord {
  date: string
  content: string
}

const users: Record<number, User> = {}

export class GratitudeBot extends Bot {
  constructor(botToken: string) {
    super(GRATITUDE_BOT_NAME, botToken)

    this.bot.start((ctx) => {
      ctx.reply(
        `Hi! I'm a bot that helps you practice gratitude. What's your name?`
      )
    })

    this.bot.on('text', async (ctx) => {
      const chatId = ctx.message.chat.id
      const incomingMessage = ctx.message.text

      if (!users[chatId]) {
        const response = await handleNewUser(chatId, incomingMessage)
        ctx.telegram.sendMessage(chatId, response)
        return
      }

      const response = await handleNewRecord(chatId, incomingMessage)
      ctx.telegram.sendMessage(chatId, response)
      return
    })
  }
}

async function handleNewUser(chatId: number, incomingMessage: string) {
  users[chatId] = {
    chatId,
    name: incomingMessage,
    records: [],
  }
  let prompt = `You are a chat bot that helps people practice gratitude`
  prompt += `The user's name is ${incomingMessage}.`
  prompt += `Your task is to welcome the user and ask them what they are grateful for today.`
  prompt += `Your message must be short. Your message must be at most one sentence.`
  const response = await getCompletion(
    [
      {
        role: 'system',
        content: prompt,
      },
    ],
    0.5
  )
  return response
}

async function handleNewRecord(chatId: number, incomingMessage: string) {
  const user = users[chatId]

  user.records.push({
    date: new Date().toISOString(),
    content: incomingMessage,
  })

  let prompt = `You are a chat bot that helps people practice gratitude`
  prompt += `The user's name is: ${user.name}.`
  prompt += `Your task is to thank the user for journaling what they are grateful for today.`
  prompt += `Your message must be short. Your message must be at most one sentence.`
  prompt += `The user's gratitude journal entry is: ${incomingMessage}.`
  const response = await getCompletion(
    [
      {
        role: 'system',
        content: prompt,
      },
    ],
    0.5
  )
  return response
}
