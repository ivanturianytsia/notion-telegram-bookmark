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
import { IS_PRODUCTION } from '../../constants'
import { GratitudeBotResponseGenerator } from './response'
import { ChatGptResponseGenerator } from './response/chatgpt'

export const GRATITUDE_BOT_NAME = 'gratitude'

export class GratitudeBot extends Bot {
  NOTIFICATION_FREQUENCY = '0 19,21 * * *'
  task: ScheduledTask
  responseGenerator: GratitudeBotResponseGenerator

  constructor(botToken: string) {
    super(GRATITUDE_BOT_NAME, botToken)

    this.responseGenerator = new ChatGptResponseGenerator()

    this.task = cron.schedule(this.NOTIFICATION_FREQUENCY, () => {
      this.sendReminder().catch((err) => {
        console.error('An error occured while sending reminder:', err)
      })
    })

    this.bot.start((ctx) => {
      this.sendMessage(
        ctx.chat.id,
        `Hi! I'm a bot that helps you practice gratitude. What's your name?`
      ).catch((err) => {
        console.error('An error occured while welcoming:', err)
      })
    })

    this.bot.on('text', (ctx) => {
      const chatId = ctx.message.chat.id
      const incomingMessage = ctx.message.text

      getUserByChatId(chatId)
        .then((user) => {
          if (!user) {
            return this.handleNewUser(chatId, incomingMessage)
          } else {
            return this.handleNewRecord(user, incomingMessage)
          }
        })
        .catch((err) => {
          console.error('An error occured while generating response:', err)
        })
    })
  }

  async handleNewUser(chatId: number, incomingMessage: string) {
    await setUserName(chatId, incomingMessage)

    const response = await this.responseGenerator.welcome(incomingMessage)

    console.log('New user added:', {
      time: new Date(),
      chatId,
      response,
    })
    await this.sendMessage(chatId, response)
  }

  async handleNewRecord(user: GratitudeUser, incomingMessage: string) {
    await saveRecord(user.id!, incomingMessage)

    const response = await this.responseGenerator.newRecord(
      user.name,
      incomingMessage
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
      const response = await this.responseGenerator.shareWithFriends(
        user.name,
        friend.name,
        incomingMessage
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

      const response = await this.responseGenerator.reminder(
        user.name,
        records.map((record) => record.content)
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
    if (IS_PRODUCTION) {
      await this.bot.telegram.sendMessage(chatId, message)
    }
  }

  sleep(timeSec: number) {
    return new Promise((resolve) => setTimeout(resolve, timeSec * 1000))
  }
}
