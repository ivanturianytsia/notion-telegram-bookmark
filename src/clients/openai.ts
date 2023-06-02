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
