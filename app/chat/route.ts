import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. フロントエンドからのデータを受け取る
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "プロンプトが空です" }, { status: 400 });
    }

    // 2. APIキーの存在チェック
    const apiKey = process.env.GEMINI_API_KEY; // ここはご自身の環境変数名に合わせてください（例: GOOGLE_GEMINI_API_KEY の場合もあります）
    if (!apiKey) {
      console.error("❌ APIキーが設定されていません。 .env.local を確認してください。");
      return NextResponse.json({ error: "APIキーがサーバーに設定されていません" }, { status: 500 });
    }

    // 3. AIの初期化と生成
    const genAI = new GoogleGenerativeAI(apiKey);
    // 最新の推奨モデルに設定（gemini-1.5-flash は高速で安定しています）
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    console.log("🤖 AIにリクエストを送信中...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("✅ AIから応答がありました");

    // 4. 結果をフロントエンドに返す
    return NextResponse.json({ text });

  } catch (error: any) {
    // 🌟 ターミナルに「本当のエラー原因」を赤字で出力する
    console.error("❌ [API Route Error] 詳細:", error.message || error);
    
    return NextResponse.json(
      { error: "AIの処理中にエラーが発生しました", details: error.message },
      { status: 500 }
    );
  }
}