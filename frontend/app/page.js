"use client";
import { useState, useRef, useEffect } from "react";
// 1. Markdown import must be here (under use client)
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      if (!res.ok) throw new Error("Backend offline");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.answer, citations: data.citations },
      ]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "Error connecting to server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto border-x bg-white shadow-lg">
      <div className="p-4 bg-blue-700 text-white font-bold text-center text-xl shadow-md">
        GSU Faculty Handbook AI
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">Ask a question about the GSU handbook!</div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 border text-black"}`}>
              <div className="font-bold text-xs mb-1 opacity-70">
                {msg.role === "user" ? "You" : "GSU AI"}
              </div>
              
              {/* 2. Changed from <p> to <ReactMarkdown> for AI responses */}
              {msg.role === "ai" ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              {msg.citations && (
                <p className="text-[10px] mt-2 italic text-gray-500">
                  Sources: Page(s) {msg.citations.join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-gray-400 animate-pulse text-sm">AI is thinking...</div>}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t bg-gray-50 flex gap-2">
        <input
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question..."
        />
        <button
          onClick={handleSend}
          className="px-6 py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}