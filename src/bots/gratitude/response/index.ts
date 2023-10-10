export interface GratitudeBotResponseGenerator {
  welcome(userName: string): Promise<string>
  newRecord(userName: string, record: string): Promise<string>
  shareWithFriends(
    userName: string,
    friendName: string,
    record: string
  ): Promise<string | null>
  reminder(userName: string, previousRecords: string[]): Promise<string>
}
