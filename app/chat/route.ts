import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const strictPrompt = `
おすすめの本を5冊提案してください。
【絶対ルール】JSON以外の文字（挨拶や解説）は一切出力しないでください。
[
  {
    "title": "タイトル",
    "author": "著者名",
    "reason": "60文字〜80文字の推薦理由"
  }
]
ユーザーの要望: "${prompt}"`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      // ★AIにデータ以外の出力を物理的に禁止させる設定
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(strictPrompt);
    return NextResponse.json({ text: result.response.text() });

  } catch (error) {
    return NextResponse.json({ error: 'AIエラー' }, { status: 500 });
  }
}