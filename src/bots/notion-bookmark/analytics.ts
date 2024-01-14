export function getDaysToFinish(
  readingSessions: {
    date: string
    endPage: number
  }[],
  totalPages: number
) {
  if (totalPages <= 0) {
    throw new Error('Invalid total pages')
  }
  if (readingSessions.length <= 0) {
    throw new Error('No reading sessions')
  }

  const endPagePerDay = getEndPagePerDay(readingSessions)
  const avgPerDay = getAvgPerDayFromEndPages(endPagePerDay)
  const pagesLeft = totalPages - Object.values(endPagePerDay).pop()!

  return Math.ceil(pagesLeft / avgPerDay)
}

export function getAveragePerDay(
  readingSessions: {
    date: string
    endPage: number
  }[]
) {
  if (readingSessions.length <= 0) {
    throw new Error('No reading sessions')
  }

  const endPagePerDay = getEndPagePerDay(readingSessions)
  return getAvgPerDayFromEndPages(endPagePerDay)
}

export function getReadingDays(
  readingSessions: {
    date: string
    endPage: number
  }[]
) {
  if (readingSessions.length <= 0) {
    throw new Error('No reading sessions')
  }

  const endPagePerDay = getEndPagePerDay(readingSessions)
  return Object.keys(endPagePerDay).length
}

export function getStartDay(
  readingSessions: {
    date: string
    endPage: number
  }[]
) {
  if (readingSessions.length <= 0) {
    throw new Error('No reading sessions')
  }

  const endPagePerDay = getEndPagePerDay(readingSessions)
  return Object.keys(endPagePerDay)[0]
}

function getEndPagePerDay(
  readingSessions: {
    date: string
    endPage: number
  }[]
) {
  readingSessions = readingSessions.slice()
  readingSessions.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  return readingSessions.reduce<Record<string, number>>(
    (result, { date, endPage }) => {
      const dayStr = new Date(date).toISOString().split('T')[0]
      return {
        ...result,
        [dayStr]: Math.max(result[dayStr] || 0, endPage),
      }
    },
    {}
  )
}

function getAvgPerDayFromEndPages(endPagePerDay: Record<string, number>) {
  let newPrevEndPage = 0
  const progressPerDay = Object.values(endPagePerDay)
    .map((endPage) => {
      const prevEndPage = newPrevEndPage
      newPrevEndPage = Math.max(newPrevEndPage, endPage)
      return Math.max(endPage - prevEndPage, 0)
    })
    .filter((progress) => progress > 0)

  return (
    progressPerDay.reduce((sum, progress) => {
      return sum + progress
    }) / progressPerDay.length
  )
}
