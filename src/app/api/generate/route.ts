import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { provider, model, systemPrompt, userPrompt } = await req.json()

    if (provider !== 'openrouter') {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })
    }

    const url = 'https://openrouter.ai/api/v1/chat/completions'
    const body = {
      model: model || 'google/gemini-2.0-flash-exp',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      // Safety: ensure concise output
      max_tokens: 4096,
      temperature: 0.6
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Inkwell 2.0'
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text || `OpenRouter error ${res.status}` }, { status: res.status })
    }

    const data = await res.json()
    const text: string | undefined = data?.choices?.[0]?.message?.content
    if (!text) {
      return NextResponse.json({ error: 'No content returned from OpenRouter' }, { status: 500 })
    }

    return NextResponse.json({ text })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}



