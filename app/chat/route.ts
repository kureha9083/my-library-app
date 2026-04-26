import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const strictPrompt = `
以下のキーワードについて、おすすめの本を5冊教えてください。
キーワード: ${prompt}

【重要：出力ルール】
・挨拶、解説、Markdown記法は禁止。
・必ず [ { "title": "...", "author": "...", "reason": "..." } ] の形式のみで出力。
・"reason"（推薦理由）は、本の魅力を【60文字〜80文字】で簡潔にまとめること。
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(strictPrompt);
    let responseText = result.response.text();

    // AIがお喋り（余計な文字）を混ぜても、[ ] の中身だけを無理やり抜き出す処理
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    return NextResponse.json({ text: responseText });

  } catch (error) {
    return NextResponse.json({ error: 'AIエラー' }, { status: 500 });
  }
}