export function getDaysToFinish(
  readingSessions: {
    date: string
    endPage: number
  }[],
  totalPages: number
) {
  if (readingSessions.length <= 0) {
    throw new Error('No reading sessions')
  }
  if (totalPages <= 0) {
    throw new Error('Invalid total pages')
  }
  readingSessions = readingSessions.slice()
  readingSessions.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  const endPagePerDay = readingSessions.reduce<Record<string, number>>(
    (result, { date, endPage }) => {
      const dayStr = new Date(date).toISOString().split('T')[0]
      return {
        ...result,
        [dayStr]: Math.max(result[dayStr] || 0, endPage),
      }
    },
    {}
  )

  let newPrevEndPage = 0
  const progressPerDay = Object.values(endPagePerDay)
    .map((endPage) => {
      const prevEndPage = newPrevEndPage
      newPrevEndPage = Math.max(newPrevEndPage, endPage)
      return Math.max(endPage - prevEndPage, 0)
    })
    .filter((progress) => progress > 0)

  const avgPerDay =
    progressPerDay.reduce((sum, progress) => {
      return sum + progress
    }) / progressPerDay.length

  const pagesLeft = totalPages - Object.values(endPagePerDay).pop()!

  return Math.ceil(pagesLeft / avgPerDay)
}
