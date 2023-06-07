import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { NotionClient } from '../../clients/notion'

const USER_DATABASE_ID = '5c171fd07e9847e9b65013cc1c37bf88'
const RECORDS_DATABASE_ID = '538e08b2797542d6a860bc69221f1d67'

export class GratitudeUser {
  constructor(public chatId: number, public name: string, public id?: string) {}

  static fromNotion(result: PageObjectResponse) {
    const { Name: name, 'Chat Id': userChatId } = result.properties

    return new GratitudeUser(
      userChatId.type === 'number' && userChatId.number ? userChatId.number : 0,
      name.type === 'title' ? name.title[0].plain_text : '',
      result.id
    )
  }
}

export class GratitudeRecord {
  constructor(
    public content: string,
    public userId?: string,
    public created?: Date,
    public id?: string
  ) {}

  static fromNotion(result: PageObjectResponse) {
    const { Content: content, User: user, Created: created } = result.properties

    return new GratitudeRecord(
      content.type === 'title' ? content.title[0].plain_text : '',
      user.type === 'relation' && user.relation ? user.relation[0].id : '',
      created.type === 'date' && created.date
        ? new Date(created.date.start)
        : undefined,
      result.id
    )
  }
}

export async function getUserByChatId(chatId: number) {
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

  return GratitudeUser.fromNotion(results[0] as PageObjectResponse)
}

export async function setUserName(chatId: number, name: string) {
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

export async function saveRecord(userId: string, content: string) {
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
      Created: {
        type: 'date',
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  })
}

export async function getUsers() {
  const { results } = await NotionClient.client.databases.query({
    database_id: USER_DATABASE_ID,
  })

  return results.map((result) =>
    GratitudeUser.fromNotion(result as PageObjectResponse)
  )
}

export async function getLastRecords(userId: string, limit = 3) {
  const { results } = await NotionClient.client.databases.query({
    database_id: RECORDS_DATABASE_ID,
    filter: {
      property: 'User',
      relation: {
        contains: userId,
      },
    },
    sorts: [
      {
        property: 'Created',
        direction: 'descending',
      },
    ],
    page_size: limit,
  })

  return results.map((result) =>
    GratitudeRecord.fromNotion(result as PageObjectResponse)
  )
}
