"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  // scroll to bottom whenever messages update
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // send message to backend and get response
  const handleSend = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "Error: Could not reach the backend." }]);
    }
  };

  return (
    <div className="app-root">
      <div className="main">
        <div className="topbar">
          <span className="topbar-title">GSU CS Chatbot</span>
        </div>

        {/* message list */}
        <div className="chat-area">
          <div className="chat-inner">
            {messages.length === 0 && (
              <div className="empty-state">Ask me anything about courses, faculty, or advising.</div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`msg-row ${msg.role === "user" ? "user" : ""}`}>
                <div className="msg-wrap">
                  <div className="msg-label">{msg.role === "user" ? "YOU" : "AI"}</div>
                  <div className="msg-body">
                    <p>{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* input bar at the bottom */}
        <div className="input-bar">
          <div className="input-bar-inner">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question..."
            />
            <button className="send-btn" onClick={handleSend}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
