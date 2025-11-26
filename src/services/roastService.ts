/**
 * Converts a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
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

export interface RoastResponse {
  target: string
  roast: string
  rating: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * Generates a roast for a plate image using Netlify function
 */
export async function generateRoast(file: File): Promise<RoastResponse> {
  try {
    // Convert file to base64
    const imageBase64 = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    // Determine the function URL - use full URL in production, relative in dev
    const functionUrl = import.meta.env.PROD
      ? `${window.location.origin}/.netlify/functions/roast`
      : '/.netlify/functions/roast'

    console.log('[roast] Calling Netlify function:', functionUrl)
    console.log('[roast] Image size:', imageBase64.length, 'bytes (base64)')

    // Call Netlify function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
      }),
    })

    console.log('[roast] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[roast] Error response:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || `HTTP error! status: ${response.status}` }
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: RoastResponse = await response.json()
    console.log('[roast] Success! Received:', data)
    
    return data
  } catch (error) {
    console.error('[roast] Error generating roast:', error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to generate roast. Please try again.')
  }
}

