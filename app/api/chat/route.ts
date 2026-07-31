// 반드시 맨 위에 이 import 구문들이 있어야 합니다!
import { google } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // 1. 일반 대화 응답 스트리밍 (Gemini 1.5 Flash)
    // 윗줄의 import 덕분에 이제 에러가 나지 않습니다.
    const result = streamText({
      model: google('gemini-1.5-flash'),
      messages,
    });

    // 2. 우측 문서용 요약 추출
    let summaryHeader = '';
    try {
      const summaryResult = await generateText({
        model: google('gemini-1.5-flash'),
        prompt: `다음 대화 내용에서 '문제(주제)'와 '해결 과정(답변 요약)'을 추출해서 아래 JSON 형식으로만 응답해줘. 다른 설명 없이 순수 JSON만 반환해.

대화 내용: "${lastUserMessage}"

JSON 형식:
{
  "issue": "문제 또는 질문 주제 요약 (1~2문장)",
  "solution": "해결 내용 또는 AI 답변 핵심 요약 (2~3문장)"
}`,
      });

      // JSON 내 마크다운 태그 제거
      const cleanJson = summaryResult.text.replace(/```json|```/g, '').trim();
      summaryHeader = encodeURIComponent(cleanJson);
    } catch (e) {
      console.error('요약 생성 실패:', e);
    }

    // 대화 스트림과 요약 헤더를 함께 반환
    return result.toTextStreamResponse({
      headers: {
        'x-document-update': summaryHeader,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'AI 응답 실패' }), { status: 500 });
  }
}