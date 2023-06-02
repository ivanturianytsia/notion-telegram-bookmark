import { Client } from '@notionhq/client'

export class NotionClient {
  private static _instance: Client

  private constructor() {
    if (!process.env.NOTION_TOKEN) {
      throw new Error('NOTION_TOKEN not set')
    }
  }

  static get client() {
    if (!NotionClient._instance) {
      NotionClient._instance = new Client({
        auth: process.env.NOTION_TOKEN,
      })
    }

    return NotionClient._instance
  }
}
