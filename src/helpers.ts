export function parsePageNumber(messageText: string) {
  const isPageNumber = /^\d+$/.test(messageText)
  return isPageNumber ? parseInt(messageText) : null
}
