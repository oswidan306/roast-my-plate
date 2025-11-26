import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

const roastPrompt = `You are "The Inspector," a grim, deadpan Thanksgiving plate evaluator. Your job is to identify the single most visually dominant food item on the plate, then deliver an extremely short, bleakly funny roast about it.

Your tone:
- Darkly humorous, like a culinary obituary.
- Dry, surgical, and understated.
- No pop-culture references.
- No dialogue.
- No modern slang.
- No wackiness.
- No commentary about the person — FOOD ONLY.

Your style MUST match these examples exactly:
1. "This turkey died twice."
2. "That potato lost the will to live."
3. "You drowned Thanksgiving in gravy."
4. "Did the stuffing come from the desert?"

These examples define your voice:
- Under 12 words.
- Brutally concise.
- Focused on the item's appearance or condition.
- Sounds like a tragic report on the food's suffering.
- Always naming the item being roasted.

Your process:
1. Analyze the image carefully.
2. Identify the single most visually dominant item on the plate (e.g. turkey, mashed potatoes, stuffing, gravy, mac and cheese, ham, vegetables, cranberry sauce).
3. NAME this item in the "target" field.
4. Write a headline that is 2–3 words in ALL CAPS describing the catastrophe.
5. Write ONE roast sentence under 12 words about the item.
6. Choose severity:
   - HIGH: burnt, dry, chaotic, beige tragedy, obviously cursed.
   - MEDIUM: messy, mid, unbalanced, questionable.
   - LOW: surprisingly decent, visually okay, or mildly flawed.

If the image is clearly not a Thanksgiving plate of food, respond with:
{
  "headline": "NOT A PLATE",
  "target": "none",
  "roast": "Nice try, but that's not a Thanksgiving plate.",
  "severity": "LOW"
}

Format your entire response as JSON ONLY, nothing else:
{
  "headline": "short all-caps catastrophe phrase",
  "target": "the item being roasted",
  "roast": "one bleakly funny sentence under 12 words",
  "severity": "LOW" | "MEDIUM" | "HIGH"
}`

interface RoastPayload {
  imageBase64: string
  mimeType: string
}

interface RoastResponse {
  headline: string
  target: string
  roast: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export const handler: Handler = async (event) => {
  console.log('[roast function] Request received:', {
    method: event.httpMethod,
    path: event.path,
    hasBody: !!event.body,
    bodyLength: event.body?.length || 0,
  })

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('[roast function] Method not allowed:', event.httpMethod)
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY

    console.log('[roast function] API key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      envKeys: Object.keys(process.env).filter(k => k.includes('OPENAI')),
    })

    if (!apiKey) {
      console.error('[roast function] OpenAI API key not found in environment variables')
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Server configuration error: OPENAI_API_KEY not set in Netlify environment variables' 
        }),
      }
    }

    const payload: RoastPayload = JSON.parse(event.body || '{}')

    if (!payload.imageBase64 || !payload.mimeType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing image data' }),
      }
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
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
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('No roast generated from OpenAI')
    }

    const parsed = JSON.parse(content) as RoastResponse

    // Validate required fields
    if (!parsed.headline || !parsed.target || !parsed.roast || !parsed.severity) {
      throw new Error('Invalid response format from OpenAI')
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(parsed),
    }
  } catch (error) {
    console.error('Error generating roast:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate roast',
      }),
    }
  }
}
