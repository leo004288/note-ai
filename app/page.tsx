'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface DocItem {
  issue: string;
  solution: string;
  timestamp: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 메시지 전송 처리 (순수 fetch 사용으로 SDK 함수 에러 원천 차단)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setInput('');

    // 1. 유저 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // 2. 백엔드로 fetch 요청
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '응답을 받아오지 못했습니다.');
      }

      // 3. AI 메시지 추가
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // 4. 우측 자동 문서 저장 메모장에 추가
      setDocs((prev) => [
        ...prev,
        {
          issue: userContent.length > 50 ? userContent.slice(0, 50) + '...' : userContent,
          solution: data.text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error: any) {
      console.error('전송 에러:', error);
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* ---------------- 좌측: AI 대화창 ---------------- */}
      <div className="w-1/2 flex flex-col border-r border-gray-300 bg-white">
        <div className="p-4 bg-slate-800 text-white font-bold text-lg flex justify-between">
          <span>💬 AI 대화창</span>
          {isLoading && <span className="text-xs text-yellow-400 self-center font-normal">AI 답변 생각 중...</span>}
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

        {/* 폼 및 입력창 */}
        <form 
          onSubmit={handleSubmit} 
          className="p-4 border-t border-gray-200 flex gap-2 relative z-10"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문이나 문제를 입력하세요..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isLoading ? '생성 중...' : '전송'}
          </button>
        </form>
      </div>

      {/* ---------------- 우측: 실시간 자동 저장 문서 ---------------- */}
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