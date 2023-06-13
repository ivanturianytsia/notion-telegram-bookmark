import cron, { ScheduledTask } from 'node-cron'
import { Bot } from '../bot'
import {
  getCompletionWithRetry,
  getCompletionWithRetryOrFallback,
} from '../../clients/openai'
import {
  GratitudeUser,
  getLastRecords,
  getUserByChatId,
  getUsers,
  saveRecord,
  setUserName,
} from './notion'
import { isProduction } from '../../constants'

export const GRATITUDE_BOT_NAME = 'gratitude'

export class GratitudeBot extends Bot {
  NOTIFICATION_FREQUENCY = '0 19,21 * * *'
  task: ScheduledTask

  constructor(botToken: string) {
    super(GRATITUDE_BOT_NAME, botToken)

    this.task = cron.schedule(this.NOTIFICATION_FREQUENCY, async () => {
      try {
        await this.sendReminder()
      } catch (err) {
        console.error('An error occured while sending reminder:', err)
      }
    })

    this.bot.start((ctx) => {
      try {
        this.sendMessage(
          ctx.chat.id,
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
    prompt += `Your task is to welcome the user and ask them what they are grateful for today.`
    prompt += `Your message must be short. Your message must be at most one sentence.`
    prompt += `The user's name is ${incomingMessage}.`
    const temperature = 0.5
    const response = await getCompletionWithRetryOrFallback(
      [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature,
      `Hi ${incomingMessage}! What are you grateful for today?`
    )
    console.log('New user added:', {
      time: new Date(),
      chatId,
      response,
    })
    await this.sendMessage(chatId, response)
  }

  async handleNewRecord(user: GratitudeUser, incomingMessage: string) {
    await saveRecord(user.id!, incomingMessage)

    let prompt = `You are a chat bot that helps people practice gratitude`
    prompt += `Your task is to thank the user for journaling what they are grateful for today.`
    prompt += `Your message must be short. Your message must be at most one sentence.`
    prompt += `The user's name is: ${user.name}.`
    prompt += `The user's gratitude journal entry is: ${incomingMessage}.`
    const temperature = 0.5
    const response = await getCompletionWithRetryOrFallback(
      [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature,
      `Thanks for journaling what you are grateful for today!`
    )
    console.log('New record added:', {
      time: new Date(),
      chatId: user.chatId,
      incomingMessage,
      response,
    })
    await this.sendMessage(user.chatId, response)

    await this.sleep(20)
    await this.shareWithFriends(user, incomingMessage)
  }

  async shareWithFriends(friend: GratitudeUser, incomingMessage: string) {
    const users = await getUsers()
    for await (const user of users) {
      if (friend.id === user.id) {
        continue
      }
      let prompt = `You are a chat bot that helps people practice gratitude`
      prompt += `Your task is to encourage the user to journal what they are grateful for today `
      prompt += `by sharing with the user what their friend was grateful for today.`
      prompt += `Your message must be short. Your message must be at most 1-2 sentences.`
      prompt += `The user's name is: ${user.name}.`
      prompt += `The friend's name is: ${friend.name}.`
      prompt += `The friend's gratitude jornal record for today is: ${incomingMessage}.`
      const temperature = 0.7
      const response = await getCompletionWithRetry(
        [
          {
            role: 'system',
            content: prompt,
          },
        ],
        temperature
      )
      if (response) {
        console.log('Sharing record with friends:', {
          time: new Date(),
          chatId: user.chatId,
          incomingMessage,
          response,
        })
        await this.sendMessage(user.chatId, response)
      }

      await this.sleep(20)
    }
  }

  async sendReminder() {
    const users = await getUsers()
    for await (const user of users) {
      const records = await getLastRecords(user.id!)
      const fromToday = records.filter((record) => {
        const today = new Date()
        return (
          record.created &&
          record.created.getDate() === today.getDate() &&
          record.created.getMonth() === today.getMonth() &&
          record.created.getFullYear() === today.getFullYear()
        )
      })
      if (fromToday.length > 0) {
        continue
      }
      let prompt = `You are a chat bot that helps people practice gratitude`
      prompt += `Your task is to remind the user to journal what they are grateful for today.`
      prompt += `Your message must be short. Your message must be at most 1-2 sentences.`
      prompt += `The user's name is: ${user.name}.`
      if (records.length > 0) {
        prompt += `Maybe, use a summary of their latest journal entries to encourage them to add a new one.`
        prompt += `The user's latest gratitude journal entries were:`
        records.forEach((record) => {
          prompt += `- ${record.content}.`
        })
      }
      const temperature = 0.7
      const response = await getCompletionWithRetryOrFallback(
        [
          {
            role: 'system',
            content: prompt,
          },
        ],
        temperature,
        `Hi ${user.name}! What are you grateful for today?`
      )
      console.log('Sending reminder:', {
        time: new Date(),
        chatId: user.chatId,
        response,
      })
      await this.sendMessage(user.chatId, response)

      await this.sleep(20)
    }
  }

  async sendMessage(chatId: number, message: string) {
    if (isProduction) {
      await this.bot.telegram.sendMessage(chatId, message)
    }
  }

  sleep(timeSec: number) {
    return new Promise((resolve) => setTimeout(resolve, timeSec * 1000))
  }
}
