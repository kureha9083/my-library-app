import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const strictPrompt = `
ユーザーの要望: "${prompt}"
上記に合うおすすめの本を5冊提案してください。
必ず以下のJSON配列形式で出力してください。それ以外の文字は一切不要です。
[
  {
    "title": "本のタイトル",
    "author": "著者名",
    "reason": "60文字〜80文字の簡潔な推薦理由"
  }
]
`;

    // ★ここが最強の解決策：AIの口を塞ぎ「絶対にデータしか返せない」ようにする設定
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(strictPrompt);
    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });

  } catch (error) {
    return NextResponse.json({ error: 'AIエラー' }, { status: 500 });
  }
}