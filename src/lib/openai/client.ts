import OpenAI from 'openai'
import { roastPrompt, defaultModel } from './prompt'

export interface RoastResponse {
  roast: string
}

export interface RoastPayload {
  imageBase64: string
  mimeType: string
}

/**
 * Converts a File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Requests a roast from OpenAI Vision API
 * Note: In production, this should be called from a backend API to keep the API key secure
 */
export async function requestRoast(payload: RoastPayload): Promise<RoastResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file. ' +
      'For production, use a backend API endpoint instead.'
    )
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Only for development - use backend in production
  })

  try {
    const response = await openai.chat.completions.create({
      model: defaultModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: roastPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${payload.mimeType};base64,${payload.imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 150,
      temperature: 0.9, // Higher temperature for more creative/comedic roasts
    })

    const roast = response.choices[0]?.message?.content?.trim()

    if (!roast) {
      throw new Error('No roast generated from OpenAI')
    }

    return { roast }
  } catch (error) {
    console.error('[roast] OpenAI API error:', error)
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`)
    }
    throw error
  }
}
