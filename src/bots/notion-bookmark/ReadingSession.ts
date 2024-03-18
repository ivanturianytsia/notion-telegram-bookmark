import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { NotionClient } from '../../clients/notion'

const READING_SESSIONS_DATABASE_ID = '9339fc34a20d401881f43a33570936f5'

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

  static async createBookmark(pageNumber: number, bookId: string) {
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
              id: bookId,
            },
          ],
        },
      },
    })
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
