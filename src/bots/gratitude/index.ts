import { Bot } from '../bot'
import { getCompletion } from '../../clients/openai'
import { NotionClient } from '../../clients/notion'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

export const GRATITUDE_BOT_NAME = 'gratitude'

const USER_DATABASE_ID = '5c171fd07e9847e9b65013cc1c37bf88'
const RECORDS_DATABASE_ID = '538e08b2797542d6a860bc69221f1d67'

interface User {
  id: string
  chatId: number
  name: string
}

export class GratitudeBot extends Bot {
  constructor(botToken: string) {
    super(GRATITUDE_BOT_NAME, botToken)

    this.bot.start((ctx) => {
      try {
        ctx.reply(
          `Hi! I'm a bot that helps you practice gratitude. What's your name?`
        )
      } catch (err) {
        console.error(err)
      }
    })

    this.bot.on('text', async (ctx) => {
      try {
        const chatId = ctx.message.chat.id
        const incomingMessage = ctx.message.text

        const user = await getUserByChatId(chatId)

        if (!user) {
          const response = await handleNewUser(chatId, incomingMessage)
          console.log('New user added:', {
            chatId,
            response,
          })
          ctx.telegram.sendMessage(chatId, response)
          return
        }

        const response = await handleNewRecord(user, incomingMessage)
        console.log('New record added:', {
          chatId,
          record: incomingMessage,
          response,
        })
        ctx.telegram.sendMessage(chatId, response)
      } catch (err) {
        console.error(err)
      }
    })
  }
}

async function handleNewUser(chatId: number, incomingMessage: string) {
  await setUserName(chatId, incomingMessage)
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

async function handleNewRecord(user: User, incomingMessage: string) {
  await saveRecord(user.id, incomingMessage)

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

async function getUserByChatId(chatId: number) {
  const { results } = await NotionClient.client.databases.query({
    database_id: USER_DATABASE_ID,
    filter: {
      property: 'Chat Id',
      number: {
        equals: chatId,
      },
    },
  })

  if (results.length === 0) {
    return null
  }

  const { Name: name, 'Chat Id': userChatId } = (
    results[0] as PageObjectResponse
  ).properties

  const user: User = {
    id: results[0].id,
    chatId:
      userChatId.type === 'number' && userChatId.number ? userChatId.number : 0,
    name: name.type === 'title' ? name.title[0].plain_text : '',
  }

  return user
}

async function setUserName(chatId: number, name: string) {
  return NotionClient.client.pages.create({
    parent: {
      database_id: USER_DATABASE_ID,
    },
    properties: {
      Name: {
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: name,
            },
          },
        ],
      },
      'Chat Id': {
        type: 'number',
        number: chatId,
      },
    },
  })
}

async function saveRecord(userId: string, content: string) {
  return NotionClient.client.pages.create({
    parent: {
      database_id: RECORDS_DATABASE_ID,
    },
    properties: {
      Content: {
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content,
            },
          },
        ],
      },
      User: {
        type: 'relation',
        relation: [
          {
            id: userId,
          },
        ],
      },
    },
  })
}
