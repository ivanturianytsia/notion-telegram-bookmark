import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import {
  getAveragePerDay,
  getDaysToFinish,
  getReadingDays,
  getStartDay,
} from './analytics'
import { NotionClient } from '../../clients/notion'
import { ReadingSession } from './ReadingSession'

const BOOK_DATABASE_ID = 'c50dd28e9a3a420b991261359efc205d'

export class Book {
  constructor(
    public id: string,
    public title: string,
    public totalPages: number,
    public bookmarkPropertyId: string,
    public percentCompletedPropertyId: string
  ) {}

  public createBookmark(pageNumber: number) {
    return ReadingSession.createBookmark(pageNumber, this.id)
  }

  public async getProgress() {
    const sessions = await ReadingSession.getReadingSessionsForBook(this.id)
    return sessions.filter(({ date }) => {
      return date !== ''
    })
  }

  public async appendQuote(text: string) {
    await NotionClient.client.blocks.children.append({
      block_id: this.id,
      children: [
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: text },
              },
            ],
          },
        },
      ],
    })
  }

  public async getDaysToFinish() {
    const readingSessions = await this.getProgress()
    return getDaysToFinish(readingSessions, this.totalPages)
  }

  public async getAveragePerDay() {
    const readingSessions = await this.getProgress()
    return getAveragePerDay(readingSessions)
  }

  public async getStartDay() {
    const readingSessions = await this.getProgress()
    return new Date(getStartDay(readingSessions))
  }

  public async getReadingDays() {
    const readingSessions = await this.getProgress()
    return getReadingDays(readingSessions)
  }

  public async getPercentCompleted() {
    const result = await NotionClient.client.pages.properties.retrieve({
      page_id: this.id,
      property_id: this.percentCompletedPropertyId,
    })

    return (
      (result.type === 'property_item' &&
        result.property_item.type === 'rollup' &&
        result.property_item.rollup.type === 'number' &&
        result.property_item.rollup.number) ||
      0
    )
  }

  public async getBookmark() {
    const result = await NotionClient.client.pages.properties.retrieve({
      page_id: this.id,
      property_id: this.bookmarkPropertyId,
    })

    return (
      (result.type === 'property_item' &&
        result.property_item.type === 'rollup' &&
        result.property_item.rollup.type === 'number' &&
        result.property_item.rollup.number) ||
      0
    )
  }

  static async getCurrentBook(): Promise<Book | null> {
    const currentBooks = await Book.getCurrentBooks()

    if (currentBooks.length === 0) {
      return null
    }

    return currentBooks[0]
  }

  static async getCurrentBooks() {
    const { results } = await NotionClient.client.databases.query({
      database_id: BOOK_DATABASE_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'In Progress',
        },
      },
    })

    return (
      results.filter((book) => {
        return 'properties' in book
      }) as PageObjectResponse[]
    ).map((book) => {
      return Book.fromNotion(book)
    })
  }

  static async getBookbyId(bookId: string) {
    const result = await NotionClient.client.pages.retrieve({
      page_id: bookId,
    })

    if ('properties' in result) {
      return Book.fromNotion(result)
    }

    return null
  }

  static fromNotion(book: PageObjectResponse) {
    const { Name } = book.properties
    const title =
      Name?.type === 'title'
        ? `${Name.title.map((clause) => clause.plain_text).join()}`
        : 'the current book'

    const totalPages =
      book.properties.Pages?.type === 'number'
        ? book.properties.Pages.number || 0
        : 0

    const bookmarkPropertyId = book.properties.Bookmark?.id

    const percentCompletedPropertyId = book.properties['Completed %'].id

    return new Book(
      book.id,
      title,
      totalPages,
      bookmarkPropertyId,
      percentCompletedPropertyId
    )
  }
}
