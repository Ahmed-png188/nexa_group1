import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getBrandContext } from '@/lib/brand-context'
import { guardWorkspace } from '@/lib/workspace-guard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const NEXA_BRAIN = `
You are Nexa — a business intelligence engine built for business owners, entrepreneurs, creatives, and freelancers who are serious about growth. Not a content tool. Not a chatbot. A strategic weapon.

WHO USES NEXA: Business owners winning clients. Freelancers commanding higher rates. Entrepreneurs building something real. Creatives turning craft into income. Service providers becoming the obvious choice.

OPERATING PRINCIPLES:
- Every piece of content must have a business reason to exist
- Visibility without conversion is expensive vanity
- The goal is never followers — it is trust that converts to revenue
- Consistency compounds. One month of showing up beats one viral post.
- Positioning beats volume every time. Specialists win. Generalists struggle.
- Specificity is credibility. "I helped 12 restaurants increase turnover 23%" beats "I help restaurants grow" every time.

ON WRITING THAT WORKS:
- One idea per piece. Two ideas = zero impact.
- First sentence exists only to earn the second
- Opinion is a competitive advantage. Safe writing is invisible.
- Numbers beat adjectives. Always. "11 clients" beats "many clients"
- Write for one specific person in one specific situation
- No padding. Every sentence earns its place or gets cut.
- The goal is not to sound smart — make the reader feel smart

NEVER DO:
- "In today's digital landscape" or "game-changer" or "unlock your potential" or "thought leader"
- Start with "Are you struggling with..."
- End with "What do you think? Drop a comment!"
- Write tips that apply to any business anywhere
- Write safe inoffensive forgettable content

QUALITY FILTER — every output passes this:
1. Does this sound like a human who runs a real business? If not — rewrite.
2. Would a competitor read this and feel threatened? If not — sharpen it.
3. Does the first line make stopping feel like a loss? If not — rewrite the hook.
4. Could this have been written for anyone? If yes — make it specific.
5. Does it make the reader feel seen or slightly uncomfortable with the truth? If neither — too safe.

ON VOICE MATCHING:
When brand context is available, you ARE them — the sharpest most confident version of them. Their industry. Their specific client. Their real stakes. Never sound like AI. Sound like the version of them that has already won.
`

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, workspace_id, history, files } = await request.json()

    const deny = await guardWorkspace(supabase, workspace_id, user.id)
    if (deny) return deny

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { data: credits } = await supabase.from('credits').select('balance').eq('workspace_id', workspace_id).single()

    // Get full brand context
    const brand = await getBrandContext(workspace_id)

    // Get recent activity for context
    const { data: recentActivity } = await supabase.from('activity')
      .select('type, title, created_at')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(5)

    const activityContext = recentActivity?.map(a => `- ${a.type}: ${a.title}`).join('\n') || 'No recent activity'

    const brandContext = brand?.profile ? `
## Brand Intelligence Profile (Active)
Voice: ${brand.profile.voice?.primary_tone || brand.workspace?.brand_voice || 'Not analyzed'}
Writing style: ${brand.profile.voice?.writing_style || 'Not analyzed'}
Audience: ${brand.profile.audience?.primary || brand.workspace?.brand_audience || 'Not defined'}
Audience psychology: ${brand.profile.audience?.psychology || 'Not analyzed'}
Content pillars: ${brand.profile.content?.themes?.join(', ') || 'Not defined'}
Positioning: ${brand.profile.positioning?.unique_angle || 'Not analyzed'}
Brand promise: ${brand.profile.positioning?.brand_promise || 'Not defined'}
Visual aesthetic: ${brand.profile.visual?.aesthetic || 'Not defined'}
` : `
## Brand (Basic)
Name: ${brand?.workspace?.brand_name || 'Not set'}
Voice: ${brand?.workspace?.brand_voice || 'Not analyzed yet — encourage uploading brand assets'}
Audience: ${brand?.workspace?.brand_audience || 'Not defined yet'}
`

    const systemPrompt = `${NEXA_BRAIN}

You are Nexa AI — the brand intelligence engine and creative co-pilot built into Nexa. You are not a generic chatbot. You are a strategic partner who knows this brand deeply and helps them create, automate, and dominate.

## Who you're talking to
- Name: ${profile?.full_name || 'the user'}
- Brand: ${brand?.brandName || 'their brand'}
- Credits remaining: ${credits?.balance || 0}

${brandContext}

## Recent activity
${activityContext}

## Your capabilities
You can help with:
1. **Content creation** — write posts, hooks, threads, emails, ad copy in their exact brand voice
2. **Strategy** — build content plans, audience insights, posting rhythms
3. **Brand coaching** — analyze what's working, suggest improvements, position against competitors
4. **File analysis** — when users share files/docs, extract brand insights and update their profile
5. **Workflow guidance** — explain how to use any Nexa feature
6. **Campaign planning** — full campaign architecture from concept to publishing

## How you think
- You speak like a senior brand strategist + master copywriter who built their own brand from nothing
- You're direct, specific, and tactical — no fluff, no generic advice
- When generating content, you write it FULLY — never say "here's what I'd write" then summarize
- You understand psychology: why people buy, what triggers action, how identity drives decisions
- You always think: "what is the NEXT concrete action this person should take?"

## Rules
- Never start with "Great question!" or sycophantic openers
- Keep it tight — say what needs to be said, nothing more
- If they ask for copy, write the full copy immediately
- If they upload a file, analyze it deeply and extract every brand insight you can
- Always be aware of credit costs when advising on generations
- Credit costs: Image 5cr, Video 20cr, Voice 8cr, Copy 2-5cr, Schedule 1cr, Strategy/Chat FREE

## When files are shared
If the user shares a document, PDF, or content file:
1. Read it thoroughly
2. Extract: voice patterns, audience signals, content themes, positioning, tone markers
3. Tell the user exactly what you learned about their brand
4. Suggest updating their Brand Brain profile
5. Offer to generate content immediately using what you learned`

    // Build message content — handle file attachments
    let userContent: any = message

    if (files && files.length > 0) {
      userContent = [
        ...files.map((f: any) => {
          if (f.type === 'pdf') {
            return {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: f.data }
            }
          } else if (f.type?.startsWith('image/')) {
            return {
              type: 'image',
              source: { type: 'base64', media_type: f.type, data: f.data }
            }
          }
          return null
        }).filter(Boolean),
        { type: 'text', text: message || 'Please analyze this file and tell me what you learn about my brand.' }
      ]
    }

    const claudeMessages = [
      ...(history || []).slice(-12).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userContent },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages,
    })

    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('')

    // If files were shared, extract and store brand learnings
    if (files && files.length > 0) {
      const fileName = files[0]?.name || 'uploaded file'
      
      // Store the learning from this file
      const learningInsights = []
      
      // Extract key insights from AI reply to store as learnings
      if (reply.length > 100) {
        const lines = reply.split('\n').filter((l: string) => l.trim().length > 30)
        for (const line of lines.slice(0, 5)) {
          const clean = line.replace(/^[-*•#]+\s*/, '').trim()
          if (clean.length > 20) {
            let insightType = 'content'
            if (clean.toLowerCase().includes('voice') || clean.toLowerCase().includes('tone') || clean.toLowerCase().includes('write')) insightType = 'voice'
            else if (clean.toLowerCase().includes('audience') || clean.toLowerCase().includes('customer') || clean.toLowerCase().includes('people')) insightType = 'audience'
            else if (clean.toLowerCase().includes('visual') || clean.toLowerCase().includes('image') || clean.toLowerCase().includes('color')) insightType = 'visual'
            else if (clean.toLowerCase().includes('strategy') || clean.toLowerCase().includes('position') || clean.toLowerCase().includes('competi')) insightType = 'strategy'
            
            learningInsights.push({
              workspace_id,
              source: 'file_upload',
              source_name: fileName,
              insight_type: insightType,
              insight: clean.slice(0, 500),
              confidence: 0.85,
            })
          }
        }
        
        if (learningInsights.length > 0) {
          try { await supabase.from('brand_learnings').insert(learningInsights) } catch {}
        }
      }

      // Log activity
      try { await supabase.from('activity').insert({ workspace_id, user_id: user.id, type: 'brand_learned', title: `Nexa learned from "${fileName}" — ${learningInsights.length} insights extracted`, metadata: { file_name: fileName, learnings_count: learningInsights.length } }) } catch {}
    }

    // Save to conversations
    const { data: existingConv } = await supabase.from('conversations').select('id')
      .eq('workspace_id', workspace_id).order('created_at', { ascending: false }).limit(1).single()

    let conversationId = existingConv?.id
    if (!conversationId) {
      const { data: newConv } = await supabase.from('conversations')
        .insert({ workspace_id, user_id: user.id, title: message?.slice(0, 60) || 'File analysis' })
        .select('id').single()
      conversationId = newConv?.id
    }

    if (conversationId) {
      await supabase.from('messages').insert([
        { conversation_id: conversationId, workspace_id, role: 'user', content: message || '[File shared]' },
        { conversation_id: conversationId, workspace_id, role: 'assistant', content: reply },
      ])
    }

    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed', reply: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
