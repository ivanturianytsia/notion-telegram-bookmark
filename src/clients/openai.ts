import { Configuration, OpenAIApi } from 'openai'
import { OPENAI_TOKEN } from '../constants'

interface AiMessage {
  role: 'user' | 'system'
  content: string
}

export async function getCompletion(messages: AiMessage[], temperature = 0) {
  if (!OPENAI_TOKEN) {
    throw new Error('OPENAI_TOKEN not set')
  }

  const configuration = new Configuration({
    apiKey: OPENAI_TOKEN,
  })
  const openai = new OpenAIApi(configuration)

  const result = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    temperature,
  })

  return result.data.choices[0].message?.content!
}

const MAX_RETRIES = 3
export async function getCompletionWithRetry(
  messages: AiMessage[],
  temperature = 0
) {
  let retries = MAX_RETRIES
  while (retries > 0) {
    try {
      return await getCompletion(messages, temperature)
    } catch (err) {
      console.error(
        `An error occured while generating response (retries left: ${retries}):`,
        err
      )
      retries--
      await sleep(20)
    }
  }
  return null
}

export async function getCompletionWithRetryOrFallback(
  messages: AiMessage[],
  temperature = 0,
  fallbackMessage: string
) {
  const response = await getCompletionWithRetry(messages, temperature)
  return response || fallbackMessage
}

function sleep(timeSec: number) {
  return new Promise((resolve) => setTimeout(resolve, timeSec * 1000))
}
