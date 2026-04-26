import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // AIにお喋りをさせないための厳格なプロンプト
    const strictPrompt = `
おすすめの本を5冊提案してください。
【厳守】JSONデータ以外は1文字も出力しないでください。挨拶も不要です。
[
  {
    "title": "タイトル",
    "author": "著者名",
    "reason": "推薦理由(60-80文字)"
  }
]
ユーザー要望: "${prompt}"`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(strictPrompt);
    return NextResponse.json({ text: result.response.text() });
  } catch (error) {
    return NextResponse.json({ error: 'AI Error' }, { status: 500 });
  }
}