import { Configuration, OpenAIApi } from 'openai'

interface AiMessage {
  role: 'user' | 'system'
  content: string
}

export async function getCompletion(messages: AiMessage[], temperature = 0) {
  if (!process.env.OPENAI_TOKEN) {
    throw new Error('OPENAI_TOKEN not set')
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_TOKEN,
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
  temperature = 0,
  fallbackMessage: string
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
  return fallbackMessage
}

function sleep(timeSec: number) {
  return new Promise((resolve) => setTimeout(resolve, timeSec * 1000))
}
