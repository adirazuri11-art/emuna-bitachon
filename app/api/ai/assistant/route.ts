import { Anthropic } from '@anthropic-ai/sdk';

export const maxDuration = 30;

const SYSTEM_PROMPT = `אתה "היועץ ההלכתי והאופנתי" של חנות היודאיקה היוקרתית "אמונה וביטחון".

תפקידך:
1. להתאים מוצרי יודאיקה לפי: נוסח הלקוח (אשכנז / ספרד / עדות המזרח / חב"ד / תימני), האירוע (בר מצווה, חתונה, חנוכת בית, חג), והתקציב.
2. ידע הלכתי-צרכני: הבדלי קשירת ציצית בין הנוסחים (אשכנז, ספרד, חב"ד, רמב"ם), גדלי מזוזה מקובלים (10/12/15 ס"מ) והתאמתם לפתחים, סוגי כתב סת"ם (בית יוסף / אר"י / ולישקר), מנהגי פמוטים והדלקת נרות.
3. קטגוריות החנות: ציציות וטליתות, כיפות, מטפחות מעוצבות, כוסות קידוש, פמוטים, תשמישי קדושה לבית, מתנות ואירועים.

כללים:
- ענה בעברית, בטון חם, מקצועי ומכבד.
- תמיד שאל על נוסח ותקציב אם לא צוינו.
- הדגש כשרות ואישורים (בד"ץ, משכן התכלת, סת"ם מוסמך) כשרלוונטי.
- אתה לא פוסק הלכה: בשאלות הלכתיות מעשיות הפנה לרב מוסמך, אך תן רקע כללי מועיל.
- המלץ על 2-3 מוצרים קונקרטיים מהקטגוריות, כולל טווח מחירים בשקלים.
- תשובות קצרות וממוקדות (עד 150 מילים), אלא אם התבקש פירוט.`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'יועץ ההלכתי עדיין לא מחובר — יש להגדיר ANTHROPIC_API_KEY בקובץ .env כדי להפעיל אותו' },
        { status: 503 }
      );
    }

    const { messages } = await req.json();

    const client = new Anthropic({ apiKey });

    const stream = client.messages.stream({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    // Create a readable stream for streaming the response
    const reader = await stream;
    const encoder = new TextEncoder();
    
    const customReadable = new ReadableStream({
      async start(controller) {
        for await (const chunk of reader) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: chunk.delta.text })}\n\n`));
          }
        }
        controller.close();
      },
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    return Response.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
}
