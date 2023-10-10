import { GratitudeBotResponseGenerator } from '.'

export class PlainResponseGenerator implements GratitudeBotResponseGenerator {
  async welcome(userName: string) {
    return `Hi ${userName}! What are you grateful for today?`
  }

  async newRecord(name: string, record: string) {
    return `Thanks for journaling what you are grateful for today, ${name}!`
  }

  async shareWithFriends(userName: string, friendName: string, record: string) {
    return `Hi ${userName}! Here's your friend ${friendName}'s gratitude record from today:\n"${record}"`
  }

  async reminder(userName: string, previousRecords: string[]) {
    return `Hi ${userName}! What are you grateful for today?`
  }
}
