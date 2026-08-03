import Anthropic from '@anthropic-ai/sdk';

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
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'יועץ ההלכתי עדיין לא מחובר — יש להגדיר ANTHROPIC_API_KEY בקובץ .env כדי להפעיל אותו' },
        { status: 503 }
      );
    }

    const { messages } = await req.json();

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return Response.json(
        { error: 'No text response from AI' },
        { status: 500 }
      );
    }

    return Response.json({ content: textContent.text });
  } catch (error) {
    console.error('AI Assistant error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
