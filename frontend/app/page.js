"use client";
import { useState, useRef, useEffect } from "react";

const SAMPLE_HISTORY = [
  { id: 1, title: "CS 4720 Office Hours" },
  { id: 2, title: "Graduation requirements" },
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState(SAMPLE_HISTORY);
  const [activeChatId, setActiveChatId] = useState(null);
  // modal visibility and which tab is active (login vs register)
  const [showModal, setShowModal] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleNewChat = () => {
    const newId = Date.now();
    setChatHistory((prev) => [{ id: newId, title: "New Chat" }, ...prev]);
    setActiveChatId(newId);
    setMessages([]);
  };

  return (
    <div className="app-root">

      {/* sidebar with chat history */}
      <aside className="sidebar">
        <div className="sidebar-header">Chat History</div>
        <button className="new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
        <div className="chat-list">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
              onClick={() => setActiveChatId(chat.id)}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <span className="topbar-title">GSU CS Chatbot</span>
          <button className="sign-in-btn" onClick={() => { setShowModal(true); setAuthTab("login"); }}>
            Sign in
          </button>
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
                  <div className="msg-body"><p>{msg.content}</p></div>
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

      {/* sign in / create account modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">GSU CS Chatbot</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            {/* tab switcher between sign in and register */}
            <div className="auth-tabs">
              <button className={`auth-tab ${authTab === "login" ? "active" : ""}`} onClick={() => setAuthTab("login")}>Sign in</button>
              <button className={`auth-tab ${authTab === "register" ? "active" : ""}`} onClick={() => setAuthTab("register")}>Create account</button>
            </div>

            {authTab === "login" ? (
              <div className="auth-form">
                <label className="field-label">Email</label>
                <input type="email" className="field-input" placeholder="you@student.gsu.edu" />
                <label className="field-label">Password</label>
                <input type="password" className="field-input" placeholder="••••••••" />
                <button className="submit-btn">Sign in</button>
                <p className="switch-text">No account? <span className="switch-link" onClick={() => setAuthTab("register")}>Create one</span></p>
              </div>
            ) : (
              <div className="auth-form">
                <label className="field-label">Full name</label>
                <input type="text" className="field-input" placeholder="Your name" />
                <label className="field-label">Email</label>
                <input type="email" className="field-input" placeholder="you@student.gsu.edu" />
                <label className="field-label">Password</label>
                <input type="password" className="field-input" placeholder="••••••••" />
                <button className="submit-btn">Create account</button>
                <p className="switch-text">Have an account? <span className="switch-link" onClick={() => setAuthTab("login")}>Sign in</span></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
