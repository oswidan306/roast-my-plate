import OpenAI from 'openai'
import { roastPrompt, defaultModel } from './prompt'

export interface RoastResponse {
  headline: string
  target: string
  roast: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
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

  console.log('[roast] Checking API key...', {
    hasKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    envKeys: Object.keys(import.meta.env).filter(k => k.includes('OPENAI')),
  })

  if (!apiKey) {
    const errorMsg = 'OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment variables.'
    console.error('[roast]', errorMsg)
    throw new Error(errorMsg)
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
      max_tokens: 200,
      temperature: 0.7, // Lower temperature for more consistent, deadpan tone
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('No roast generated from OpenAI')
    }

    try {
      const parsed = JSON.parse(content) as RoastResponse
      
      // Validate required fields
      if (!parsed.headline || !parsed.target || !parsed.roast || !parsed.severity) {
        throw new Error('Invalid response format from OpenAI')
      }

      return parsed
    } catch (parseError) {
      console.error('[roast] Failed to parse JSON response:', parseError)
      throw new Error('Invalid response format from OpenAI')
    }
  } catch (error) {
    console.error('[roast] OpenAI API error:', error)
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`)
    }
    throw error
  }
}
