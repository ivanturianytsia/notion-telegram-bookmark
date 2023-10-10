import { GratitudeBotResponseGenerator } from '.'
import {
  getCompletionWithRetry,
  getCompletionWithRetryOrFallback,
} from '../../../clients/openai'

export class ChatGptResponseGenerator implements GratitudeBotResponseGenerator {
  async welcome(userName: string) {
    let prompt = `You are a chat bot that helps people practice gratitude.`
    prompt += `Your task is to welcome the user and ask them what they are grateful for today.`
    prompt += `Your message must be short. Your message must be at most one sentence.`
    prompt += `The user's name is ${userName}.`
    const temperature = 0.5
    return getCompletionWithRetryOrFallback(
      [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature,
      `Hi ${userName}! What are you grateful for today?`
    )
  }

  async newRecord(name: string, record: string) {
    return `Thanks for journaling what you are grateful for today!`
  }

  async shareWithFriends(userName: string, friendName: string, record: string) {
    let prompt = `You are a chat bot that helps people practice gratitude.`
    prompt += `Your task is to encourage the user to journal what they are grateful for today `
    prompt += `by sharing with the user what their friend was grateful for today.`
    prompt += `Your message must be short. Your message must be at most 1-2 sentences.`
    prompt += `The user's name is: ${userName}.`
    prompt += `The friend's name is: ${friendName}.`
    prompt += `The friend's gratitude jornal record for today is: """${record}""".`
    const temperature = 0.7
    return getCompletionWithRetry(
      [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature
    )
  }

  async reminder(userName: string, previousRecords: string[]) {
    let prompt = `You are a chat bot that helps people practice gratitude.`
    prompt += `Your task is to remind the user to journal what they are grateful for today.`
    prompt += `Your message must be short. Your message must be at most 1-2 sentences.`
    prompt += `The user's name is: ${userName}.`
    if (previousRecords.length > 0) {
      prompt += `Maybe, use a summary of their latest journal entries to encourage them to add a new one.`
      prompt += `The user's latest gratitude journal entries were:`
      previousRecords.forEach((record) => {
        prompt += `- """${record}""".`
      })
    }
    const temperature = 0.7
    return getCompletionWithRetryOrFallback(
      [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature,
      `Hi ${userName}! What are you grateful for today?`
    )
  }
}
