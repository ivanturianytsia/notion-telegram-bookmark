import { Configuration, OpenAIApi } from 'openai'
import { TextHandler } from '../bot'

export const fluentBotHandler: TextHandler = async (ctx) => {
  if (!ctx.messageText || ctx.messageText.length < 10) {
    return {
      text: 'Please specify a longer prompt.',
    }
  }
  try {
    const text = await getCompletion(ctx.messageText)

    return {
      text,
    }
  } catch (err: any) {
    if (err.response?.status === 429) {
      return {
        text: `I can only handle 3 requests per minute. Please try again later.`,
      }
    }

    console.error(err)
    return {
      text: `Something went wrong.`,
    }
  }
}

async function getCompletion(prompt: string) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_TOKEN,
  })
  const openai = new OpenAIApi(configuration)

  const result = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: "Rephrase the user's message to make it sound more fluent.",
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 1,
  })

  return result.data.choices[0].message?.content!
}
