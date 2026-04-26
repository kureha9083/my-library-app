import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // AIに対する「絶対ルール」をプロンプトで強制します
    const strictPrompt = `
以下の要望に合う本を5冊提案してください。

【絶対ルール：必ず守ること】
1. 必ず以下のJSON配列フォーマット「のみ」を出力してください。
2. 挨拶、解説、Markdown記法（\`\`\`json など）は絶対に含めないでください。
3. "reason"（詳細文）は、必ず【60文字〜80文字】で簡潔に本の魅力を書いてください。長文は不可です。

要望：${prompt}

[
  {
    "title": "本のタイトル",
    "author": "著者名",
    "reason": "60文字〜80文字の簡潔な推薦理由"
  }
]
`;

    // 安定して動作する 1.5-flash モデルを使用
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(strictPrompt);
    let responseText = result.response.text();

    // 万が一AIが余計な記号（```jsonなど）をつけてきた場合、強制的に削除してデータだけにする
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'AIエラー' }, { status: 500 });
  }
}