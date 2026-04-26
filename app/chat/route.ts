import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();

    // 役割設定
    const role = mode === 'study' 
      ? 'あなたはプロの学習コンサルタント兼・専門書の司書です。ユーザーの学習目標に最適な参考書や専門書を提案します。'
      : 'あなたはプロの図書館司書です。ユーザーの気分や好みに合わせて、最適な一般文芸、小説、ビジネス書などを提案します。';

    // AIへの命令文
    const strictPrompt = `
${role}
以下の【ユーザーの要望】を分析し、最適な本を必ず5冊選び、指定されたJSONスキーマに従って出力してください。
挨拶、解説、マークダウン記法は一切不要です。

【ユーザーの要望】
${prompt}

【必須のJSON構造】
[
  {
    "title": "本のタイトル",
    "author": "著者名",
    "reason": "推薦理由。本の魅力が伝わるように60〜100文字程度で簡潔にまとめること。"
  }
]
`;

    // ★ここが最大の修正ポイント★
    // Geminiに「application/json（データ形式）でしか返事をしてはいけない」とシステム制御をかけます
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json", 
      }
    });

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