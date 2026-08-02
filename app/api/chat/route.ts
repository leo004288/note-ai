import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: '.env.local의 GEMINI_API_KEY를 확인해주세요.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // 1.5-flash는 곧 지원 종료 예정이니 2.5-flash 권장
      contents: lastUserMessage,
    });

    return Response.json({ text: result.text });
  } catch (error: any) {
    console.error('API 라우트 에러:', error);
    return Response.json({ error: error.message || 'AI 응답 생성 실패' }, { status: 500 });
  }
}