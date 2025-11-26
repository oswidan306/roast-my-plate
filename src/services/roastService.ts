import { requestRoast, fileToBase64, type RoastPayload, type RoastResponse } from '../lib/openai/client'

/**
 * Generates a roast for a plate image using OpenAI Vision API
 */
export async function generateRoast(file: File): Promise<string> {
  try {
    // Convert file to base64
    const imageBase64 = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    // Call OpenAI API
    const payload: RoastPayload = {
      imageBase64,
      mimeType,
    }

    const response: RoastResponse = await requestRoast(payload)
    
    // Format the response as: "HEADLINE\n\nroast sentence"
    return `${response.headline}\n\n${response.roast}`
  } catch (error) {
    console.error('Error generating roast:', error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to generate roast. Please try again.')
  }
}

