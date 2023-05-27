import { getDaysToFinish } from './analytics'

describe('getDaysToFinish', () => {
  it('throws if there are no reading sessions', () => {
    expect(() => getDaysToFinish([], 100)).toThrowError('No reading sessions')
  })

  it('throws if page total is invalid', () => {
    const readingSessions = [
      {
        date: '2023-01-01 00:00:00+00:00',
        endPage: 10,
      },
    ]
    expect(() => getDaysToFinish(readingSessions, -2)).toThrowError(
      'Invalid total pages'
    )
  })

  it('calculates correct days to finish', () => {
    const readingSessions = [
      {
        date: '2023-01-01 00:00:00+00:00',
        endPage: 10,
      },
      {
        date: '2023-01-02 00:00:00+00:00',
        endPage: 20,
      },
      {
        date: '2023-01-02 00:00:00+00:00',
        endPage: 30,
      },
      {
        date: '2023-01-10 00:00:00+00:00',
        endPage: 60, // Out of order, should be sorted
      },
      {
        date: '2023-01-4 00:00:00+00:00',
        endPage: 6, // Invalid record, should be ignored
      },
      {
        date: '2023-01-5 00:00:00+00:00',
        endPage: 45,
      },
    ]

    expect(getDaysToFinish(readingSessions, 90)).toEqual(2)
  })
})
