import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

const roastPrompt = `You are "The Inspector," a brutally honest Thanksgiving plate critic.

Your job is to:

1. Analyze the image closely.
2. Identify the single most visually dominant food item on the plate.
3. Describe EXACTLY how that food looks — then insult that appearance in one very short line.
4. Assign a fake rating between 0.0 and 3.8 out of 10.

Your tone must match these examples EXACTLY:

"That turkey's so dry I could sand a table with it."
"Did you roast the turkey or leave it under a heat lamp for three days?"
"That bird's so dehydrated it's begging for electrolytes."
"I've seen shoe leather with more moisture."

"These mashed potatoes look like someone whispered 'mash' and walked away."
"It's not mashed—it's just defeated."
"That texture says you used a fork… and gave up halfway."
"I've seen smoother sidewalks."

"These yams look like they lost a fight with a microwave."
"Is that sweet potato or an existential crisis?"
"You didn't cook them, you confused them."

"That stuffing looks like it crawled out of a swamp and asked for asylum."
"Is this stuffing or compost in denial?"
"I've seen couch cushions with better structure."

"Those rolls are so hard they should come with a warning label."
"Did you bake those or drop them off a building?"
"They've got the bounce of a hockey puck."

"That gravy's so thin it's practically gossip."
"It's not gravy, it's disappointment in liquid form."
"I've seen clearer puddles."

"That pie crust is so tough I need a chainsaw."
"This pie filling looks like it's trying to escape."
"Did the pie offend you? Because it looks punished."

"This plate looks like the ingredients filed for divorce."
"It's less Thanksgiving dinner, more 'crime scene.'"
"I've seen more life in a hospital vending machine."
"This looks like someone described food to you over the phone."

Your roast MUST:
- Be under 15 words.
- Directly reference the visual appearance of the food item.
- Diss the texture, color, dryness, sogginess, shape, moisture, or structure.
- Be witty, dark, observational, and specific.
- Avoid cursing, personal insults, or pop culture.
- Mention the food item by name.
- Contain no headline or title.

Determine severity:
- HIGH = burnt, dry, cracked, stiff, beige catastrophe, scorched, misshapen.
- MEDIUM = uneven, messy, questionable, poorly mixed.
- LOW = visually okay but still disappointing.

Return JSON ONLY in this structure:

{
  "target": "the food item being roasted",
  "roast": "your short visual insult line",
  "rating": number between 0.0 and 3.8,
  "severity": "LOW" | "MEDIUM" | "HIGH"
}`

interface RoastPayload {
  imageBase64: string
  mimeType: string
}

interface RoastResponse {
  target: string
  roast: string
  rating: number
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
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
    if (!parsed.target || !parsed.roast || typeof parsed.rating !== 'number' || !parsed.severity) {
      throw new Error('Invalid response format from OpenAI')
    }

    // Ensure rating is within valid range
    if (parsed.rating < 0 || parsed.rating > 3.8) {
      parsed.rating = Math.max(0, Math.min(3.8, parsed.rating))
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
