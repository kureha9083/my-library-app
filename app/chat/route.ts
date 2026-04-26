import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();

    // 1. モードに応じた役割設定
    const role = mode === 'study' 
      ? 'あなたはプロの学習コンサルタント兼・専門書の司書です。ユーザーの学習目標（資格取得、語学、専門知識など）に最適な参考書や専門書を提案します。'
      : 'あなたはプロの図書館司書です。ユーザーの気分や好みに合わせて、最適な一般文芸、小説、ビジネス書などを提案します。';

    // 2. Geminiへの超厳格な命令文（プロンプト）
    // JSON形式での出力を強制し、文字数制限を設ける
    const strictPrompt = `
${role}
以下の【ユーザーの要望】を分析し、最適な本を正確に5冊提案してください。

【厳守事項】
1. 必ず以下のJSON配列フォーマットのみを出力すること。
2. JSON以外のテキスト、挨拶、Markdown記法（\`\`\`json など）は一切含めないこと。
3. "reason"（推薦理由）は、読者が「読みたい！」と思えるように、本の魅力を簡潔に【60文字〜100文字程度】でまとめること。長すぎる文章は不可。

【出力フォーマット】
[
  {
    "title": "本のタイトル",
    "author": "著者名",
    "reason": "簡潔な推薦理由（60〜100文字）"
  }
]

【ユーザーの要望】
${prompt}
`;

    // 3. Geminiモデルの呼び出し (gemini-2.5-flash または gemini-pro)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(strictPrompt);
    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'AIからの応答の取得に失敗しました。' },
      { status: 500 }
    );
  }
}