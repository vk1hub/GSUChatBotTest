"use client";
import { useState, useRef, useEffect } from "react";
// For bold Text
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.answer },
      ]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "Error: Check backend." }]);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white border-x">
      <div className="p-4 border-b font-bold text-lg text-black">
        GSU Chatbot
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] text-black">
              <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight">
                {msg.role === "user" ? "YOU" : "AI"}
              </div>
              
              {/*Markdown for Bold Text*/}
              <div className="border-t pt-2 border-gray-100 prose prose-sm max-w-none text-black">
                {msg.role === "ai" ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          className="flex-1 p-2 border border-gray-300 outline-none text-black bg-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question..."
        />
        <button
          onClick={handleSend}
          className="px-6 py-2 border border-gray-300 bg-white text-black active:bg-gray-100"
        >
          Send
        </button>
      </div>
    </div>
  );
}