import { Client } from '@notionhq/client'
import { NOTION_TOKEN } from '../constants'

export class NotionClient {
  private static _instance: Client

  private constructor() {
    if (!NOTION_TOKEN) {
      throw new Error('NOTION_TOKEN not set')
    }
  }

  static get client() {
    if (!NotionClient._instance) {
      NotionClient._instance = new Client({
        auth: NOTION_TOKEN,
      })
    }

    return NotionClient._instance
  }
}
