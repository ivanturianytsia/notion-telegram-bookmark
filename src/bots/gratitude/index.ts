import cron, { ScheduledTask } from 'node-cron'
import { Bot } from '../bot'
import { getCompletion, getCompletionWithRetry } from '../../clients/openai'
import {
  GratitudeUser,
  getRecordsForUserFromToday,
  getUserByChatId,
  getUsers,
  saveRecord,
  setUserName,
} from './notion'

export const GRATITUDE_BOT_NAME = 'gratitude'

export class GratitudeBot extends Bot {
  NOTIFICATION_FREQUENCY = '0 16,23 * * *'
  task: ScheduledTask

  constructor(botToken: string) {
    super(GRATITUDE_BOT_NAME, botToken)

    this.task = cron.schedule(this.NOTIFICATION_FREQUENCY, async () => {
      try {
        this.sendReminder()
      } catch (err) {
        console.error('An error occured while sending reminder:', err)
      }
    })

    this.bot.start((ctx) => {
      try {
        ctx.reply(
          `Hi! I'm a bot that helps you practice gratitude. What's your name?`
        )
      } catch (err) {
        console.error('An error occured while welcoming:', err)
      }
    })

    this.bot.on('text', async (ctx) => {
      try {
        const chatId = ctx.message.chat.id
        const incomingMessage = ctx.message.text

        const user = await getUserByChatId(chatId)

        if (!user) {
          await this.handleNewUser(chatId, incomingMessage)
        } else {
          await this.handleNewRecord(user, incomingMessage)
        }
      } catch (err) {
        console.error('An error occured while generating response:', err)
      }
    })
  }

  async handleNewUser(chatId: number, incomingMessage: string) {
    await setUserName(chatId, incomingMessage)

    let prompt = `You are a chat bot that helps people practice gratitude`
    prompt += `The user's name is ${incomingMessage}.`
    prompt += `Your task is to welcome the user and ask them what they are grateful for today.`
    prompt += `Your message must be short. Your message must be at most one sentence.`
    const response = await getCompletionWithRetry(
      [
        {
          role: 'system',
          content: prompt,
        },
      ],
      0.5,
      `Hi ${incomingMessage}! What are you grateful for today?`
    )
    console.log('New user added:', {
      time: new Date(),
      chatId,
      response,
    })
    this.bot.telegram.sendMessage(chatId, response)
  }

  async handleNewRecord(user: GratitudeUser, incomingMessage: string) {
    await saveRecord(user.id!, incomingMessage)

    let prompt = `You are a chat bot that helps people practice gratitude`
    prompt += `The user's name is: ${user.name}.`
    prompt += `Your task is to thank the user for journaling what they are grateful for today.`
    prompt += `Your message must be short. Your message must be at most one sentence.`
    prompt += `The user's gratitude journal entry is: ${incomingMessage}.`
    const response = await getCompletionWithRetry(
      [
        {
          role: 'system',
          content: prompt,
        },
      ],
      0.5,
      `Thanks for journaling what you are grateful for today!`
    )
    console.log('New record added:', {
      time: new Date(),
      chatId: user.chatId,
      record: incomingMessage,
      response,
    })
    this.bot.telegram.sendMessage(user.chatId, response)
  }

  async sendReminder() {
    const users = await getUsers()
    for await (const user of users) {
      const records = await getRecordsForUserFromToday(user.id!)
      if (records.length > 0) {
        continue
      }
      let prompt = `You are a chat bot that helps people practice gratitude`
      prompt += `The user's name is: ${user.name}.`
      prompt += `Your task is to remind the user to journal what they are grateful for today.`
      prompt += `Your message must be short. Your message must be at most one sentence.`
      // prompt += `The user's gratitude journal entry is: ${incomingMessage}.`
      const response = await getCompletionWithRetry(
        [
          {
            role: 'system',
            content: prompt,
          },
        ],
        0.5,
        `Hi ${user.name}! What are you grateful for today?`
      )
      console.log('Sending reminder:', {
        time: new Date(),
        chatId: user.chatId,
        response,
      })
      this.bot.telegram.sendMessage(user.chatId, response)

      await sleep(20)
    }
  }
}

function sleep(timeSec: number) {
  return new Promise((resolve) => setTimeout(resolve, timeSec * 1000))
}
