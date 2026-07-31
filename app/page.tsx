'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';

// 문서 항목 타입 정의
interface DocItem {
  issue: string;
  solution: string;
  timestamp: string;
}

export default function Home() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // 브라우저 랜더링 타이밍 맞춤 (Hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    // onResponse 매개변수의 타입을 더 명확히 하거나 response 객체에서 직접 꺼내도록 수정
    onResponse: async (response) => {
      // response 객체가 정상적일 때만 헤더 확인
      if (response && response.headers) {
        const summaryHeader = response.headers.get('x-document-update');
        if (summaryHeader) {
          try {
            const decoded = decodeURIComponent(summaryHeader);
            const parsed = JSON.parse(decoded);

            // 필요한 데이터가 다 있는지 확인 후 상태 업데이트
            if (parsed.issue && parsed.solution) {
              setDocs((prev) => [
                ...prev,
                {
                  ...parsed,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ]);
            }
          } catch (e) {
            console.error('문서 요약 파싱 에러:', e);
          }
        }
      }
    },
    onError(error) {
      console.error('채팅 중 에러 발생:', error);
      alert('AI와 통신 중 오류가 발생했습니다. .env.local의 API 키를 확인해주세요.');
    },
  });

  // 하이드레이션 오류 방지용 로딩 화면
  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* ---------------- 좌측: AI 채팅 창 ---------------- */}
      <div className="w-1/2 flex flex-col border-r border-gray-300 bg-white">
        <div className="p-4 bg-slate-800 text-white font-bold text-lg flex justify-between">
          <span>💬 AI 대화창</span>
          {isLoading && <span className="text-xs text-yellow-400 self-center">답변 생성 중...</span>}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              하단 입력창에 질문을 입력해보세요!
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white ml-auto'
                  : 'bg-gray-100 text-gray-800 mr-auto border'
              }`}
            >
              <div className="font-semibold text-xs mb-1 opacity-75">
                {m.role === 'user' ? '나' : 'AI'}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
        </div>

        {/* 폼 제출 이벤트 핸들러 연결 확인 */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="질문이나 문제를 입력하세요..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            // 답변 생성 중일 때는 버튼 비활성화 (스크린샷 에러 해결)
            disabled={isLoading || !input?.trim()}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            전송
          </button>
        </form>
      </div>

      {/* ---------------- 우측: 실시간 자동 메모장 ---------------- */}
      <div className="w-1/2 flex flex-col bg-slate-50">
        <div className="p-4 bg-slate-700 text-white font-bold text-lg flex justify-between items-center">
          <span>📝 실시간 자동 저장 문서</span>
          <span className="text-xs font-normal bg-slate-600 px-2 py-1 rounded">
            총 {docs.length}건 기록됨
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {docs.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              대화를 시작하면 이곳에 [문제]와 [해결과정]이 자동으로 정제되어 기록됩니다.
            </div>
          ) : (
            docs.map((doc, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-2">
                <div className="text-xs text-gray-400 border-b pb-1 flex justify-between">
                  <span># {idx + 1}번째 항목</span>
                  <span>{doc.timestamp}</span>
                </div>
                <div>
                  <span className="inline-block bg-red-100 text-red-700 font-bold text-xs px-2 py-0.5 rounded mb-1">
                    📌 문제 (주제)
                  </span>
                  <p className="text-sm font-semibold text-gray-800">{doc.issue}</p>
                </div>
                <div>
                  <span className="inline-block bg-green-100 text-green-700 font-bold text-xs px-2 py-0.5 rounded mb-1">
                    💡 해결 과정 (요약)
                  </span>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{doc.solution}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}