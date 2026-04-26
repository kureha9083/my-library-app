import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();

    const role = mode === 'study' 
      ? 'プロの学習コンサルタント。資格や専門知識に最適な本を提案します。'
      : 'プロの図書館司書。気分や好みに合わせて最適な本を提案します。';

    const strictPrompt = `
${role}
ユーザーの要望: "${prompt}"

【絶対ルール】
1. 以下のJSON形式のリストのみを出力し、それ以外の挨拶や解説は一切書かないでください。
2. 本を正確に5冊提案してください。
3. "reason"（詳細）は、本の魅力を【60文字〜80文字】で簡潔に書いてください。

[
  {
    "title": "本のタイトル",
    "author": "著者名",
    "reason": "60〜80文字の簡潔な理由"
  }
]
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(strictPrompt);
    let responseText = result.response.text();

    // AIが前後にお喋りを挟んでも、[ ] の中身だけを無理やり抜き出す
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const finalData = jsonMatch ? jsonMatch[0] : responseText;

    return NextResponse.json({ text: finalData });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'AIエラー' }, { status: 500 });
  }
}