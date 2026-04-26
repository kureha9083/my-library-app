TypeScript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();

    const role = mode === 'study' 
      ? 'あなたはプロの学習コンサルタントです。' 
      : 'あなたはプロの図書館司書です。';

    const strictPrompt = `
${role}
ユーザーの要望: "${prompt}"

【絶対ルール】
1. 返答は必ず以下のJSON配列形式のみ。
2. 挨拶、解説、\`\`\`json などのマークダウン記法は一切禁止。
3. 本を5冊提案。
4. "reason"は必ず【60文字〜80文字】で簡潔に書くこと。

[
  {
    "title": "タイトル",
    "author": "著者名",
    "reason": "60〜80文字の推薦理由"
  }
]
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(strictPrompt);
    let responseText = result.response.text();

    // ★ 鉄壁の処理：AIが何を喋っても [ ] の中身だけを抽出する
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const finalData = jsonMatch ? jsonMatch[0] : responseText;

    return NextResponse.json({ text: finalData });

  } catch (error) {
    return NextResponse.json({ error: 'AIエラー' }, { status: 500 });
  }
}