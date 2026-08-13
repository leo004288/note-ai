export async function POST(req: Request) {
  try {
    const accessToken = process.env.GEMINI_API_KEY; // AQ.로 시작하는 Auth key (정상)
    console.log('🔑 키 확인:', JSON.stringify(accessToken)?.slice(0, 20), '길이:', accessToken?.length);
    if (!accessToken) {
      return Response.json(
        { error: '.env.local의 GEMINI_API_KEY를 확인해주세요.' },
        { status: 400 }
      );
    }

    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': accessToken, // ✅ Bearer 대신 이 헤더 사용
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: lastUserMessage }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.error?.message || 'Gemini API 호출 실패' },
        { status: response.status }
      );
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return Response.json({ text: generatedText });

  } catch (error: any) {
    console.error('API 라우트 에러:', error);
    return Response.json(
      { error: error.message || 'AI 응답 생성 실패' },
      { status: 500 }
    );
  }
}