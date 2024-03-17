import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import {
  getAveragePerDay,
  getDaysToFinish,
  getReadingDays,
  getStartDay,
} from './analytics'
import { NotionClient } from '../../clients/notion'

const BOOK_DATABASE_ID = 'c50dd28e9a3a420b991261359efc205d'
const READING_SESSIONS_DATABASE_ID = '9339fc34a20d401881f43a33570936f5'

export class Book {
  constructor(
    public id: string,
    public title: string,
    public totalPages: number
  ) {}

  public async getPercentCompleted() {
    const readingSessions = await this.getProgress()

    return Math.max(
      ...readingSessions.map(({ percentCompleted }) => percentCompleted)
    )
  }

  public createBookmark(pageNumber: number) {
    return NotionClient.client.pages.create({
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
              },
            },
          ],
        },
        Date: {
          type: 'date',
          date: {
            start: new Date().toISOString(),
          },
        },
        'End Page': {
          type: 'number',
          number: pageNumber,
        },
        Book: {
          type: 'relation',
          relation: [
            {
              id: this.id,
            },
          ],
        },
      },
    })
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
    return NotionClient.client.pages.retrieve({
      page_id: bookId,
    })
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

    return new Book(book.id, title, totalPages)
  }
}

export class ReadingSession {
  constructor(
    public percentCompleted: number,
    public date: string,
    public endPage: number
  ) {}

  static async getReadingSessionsForBook(bookId: string) {
    const { results } = await NotionClient.client.databases.query({
      database_id: READING_SESSIONS_DATABASE_ID,
      filter: {
        property: 'Book',
        relation: {
          contains: bookId,
        },
      },
    })

    return results
      .map((result) => {
        if ('properties' in result) {
          return ReadingSession.fromNotion(result)
        }

        return null
      })
      .filter(Boolean) as ReadingSession[]
  }

  static fromNotion(session: PageObjectResponse) {
    const {
      '%': percentProp,
      Date: dateProp,
      'End Page': endPageProp,
    } = session.properties

    const percent =
      (percentProp.type === 'formula' &&
        percentProp.formula.type === 'number' &&
        percentProp.formula.number) ||
      0
    const date = (dateProp.type === 'date' && dateProp.date!.start) || ''
    const endPage = (endPageProp.type === 'number' && endPageProp.number) || 0

    return new ReadingSession(percent, date, endPage)
  }
}
