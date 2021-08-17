import { Client } from '@notionhq/client'
import { Page, RichText } from '@notionhq/client/build/src/api-types'

const BOOK_DATABASE_ID = 'c50dd28e9a3a420b991261359efc205d'
const READING_SESSIONS_DATABASE_ID = '9339fc34a20d401881f43a33570936f5'

class NotionBooksClient extends Client {
  private static _instance: NotionBooksClient

  private constructor() {
    if (!process.env.NOTION_TOKEN) {
      throw new Error('NOTION_TOKEN not set')
    }

    super({
      auth: process.env.NOTION_TOKEN,
    })
  }

  async getCurrentBooks() {
    return this.databases.query({
      database_id: BOOK_DATABASE_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'In Progress',
        },
      },
    })
  }
      
  static getPlainText(richText: RichText[]) {
    return richText.map(clause => clause.plain_text).join()
  }

  public async createBookmark(book: Book, pageNumber: number) {
    return this.pages.create({
      parent: {
        database_id: READING_SESSIONS_DATABASE_ID,
      },
      properties: {
        Name: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: '',
              }
            },
          ],
        },
        'Date': {
          type: 'date',
          date: {
            start: (new Date()).toISOString()
          }
        },
        'End Page': {
          type: 'number',
          number: pageNumber,
        },
        'Book': {
          type: 'relation',
          relation: [{
            id: book.id,
          }],
        } as any,
      },
    });
  }

  public async getBookbyId(bookId: string) {
    return this.pages.retrieve({
      page_id: bookId,
    })
  }

  static get client() {
    if (!NotionBooksClient._instance) {
      NotionBooksClient._instance = new NotionBooksClient()
    }

    return NotionBooksClient._instance
  }
}

export class Book {
  constructor(private book: Page) {}

  get id () {
    return this.book.id
  }

  get title() {
    const { Name } = this.book.properties
    return Name.type === 'title'
      ? `"${NotionBooksClient.getPlainText(Name.title)}"`
      : 'the current book'
  }

  get pageTotal() {
    return this.book.properties.Pages.type === 'number'
      ? this.book.properties.Pages.number
      : 0
  }

  get progress() {
    const { 'Completed %': Completed } = this.book.properties
    return Completed.type === 'rollup' && Completed.rollup.type === 'number'
      ? Completed.rollup.number
      : 0
  }

  public createBookmark(pageNumber: number) {
    return NotionBooksClient.client.createBookmark(this, pageNumber)
  }

  public async refresh() {
    this.book = await NotionBooksClient.client.getBookbyId(this.book.id)
  }

  static async getCurrentBook(): Promise<Book | null> {
    const currentBooks = await NotionBooksClient.client.getCurrentBooks()

    if (currentBooks.results.length === 0) {
      return null
    }

    return new Book(currentBooks.results[0])
  }
}
