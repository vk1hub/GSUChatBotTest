"use client";
import { useState, useRef, useEffect } from "react";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

const SAMPLE_HISTORY = [
  { id: 1, title: "CS 4720 Office Hours" },
  { id: 2, title: "Graduation requirements" },
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState(SAMPLE_HISTORY);
  const [activeChatId, setActiveChatId] = useState(null);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  // controlled inputs for the auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const scrollRef = useRef(null);

  // listen for firebase auth state changes (login/logout)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

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

  // sign in with email and password using firebase auth
  const handleSignIn = async () => {
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowModal(false);
      setEmail(""); setPassword("");
    } catch {
      setAuthError("Invalid email or password.");
    }
  };

  // create a new account and save the display name to firebase profile
  const handleRegister = async () => {
    setAuthError("");
    if (!name.trim()) { setAuthError("Please enter your name."); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name.trim() });
      setShowModal(false);
      setEmail(""); setPassword(""); setName("");
    } catch {
      setAuthError("Could not create account. Check your email/password.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setMessages([]);
  };

  // reset form and open modal on the right tab
  const openModal = (tab) => {
    setAuthError(""); setEmail(""); setPassword(""); setName("");
    setAuthTab(tab); setShowModal(true);
  };

  // use display name if set, fall back to email prefix
  const displayName = user?.displayName || user?.email?.split("@")[0] || "";

  return (
    <div className="app-root">

      {/* sidebar with chat history */}
      <aside className="sidebar">
        <div className="sidebar-header">Chat History</div>
        <button className="new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
        <div className="chat-list">
          {!user && <p className="chat-list-empty">Sign in to save history.</p>}
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
          {/* show name + sign out if logged in, otherwise show sign in button */}
          {user ? (
            <div className="user-bar">
              <span className="user-name">Hi, {displayName}</span>
              <button className="sign-in-btn" onClick={handleSignOut}>Sign out</button>
            </div>
          ) : (
            <button className="sign-in-btn" onClick={() => openModal("login")}>Sign in</button>
          )}
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

      {/* auth modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">GSU CS Chatbot</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="auth-tabs">
              <button className={`auth-tab ${authTab === "login" ? "active" : ""}`} onClick={() => setAuthTab("login")}>Sign in</button>
              <button className={`auth-tab ${authTab === "register" ? "active" : ""}`} onClick={() => setAuthTab("register")}>Create account</button>
            </div>
            {authTab === "login" ? (
              <div className="auth-form">
                <label className="field-label">Email</label>
                <input type="email" className="field-input" placeholder="you@student.gsu.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
                <label className="field-label">Password</label>
                <input type="password" className="field-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                {authError && <p className="auth-error">{authError}</p>}
                <button className="submit-btn" onClick={handleSignIn}>Sign in</button>
                <p className="switch-text">No account? <span className="switch-link" onClick={() => setAuthTab("register")}>Create one</span></p>
              </div>
            ) : (
              <div className="auth-form">
                <label className="field-label">Full name</label>
                <input type="text" className="field-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                <label className="field-label">Email</label>
                <input type="email" className="field-input" placeholder="you@student.gsu.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
                <label className="field-label">Password</label>
                <input type="password" className="field-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                {authError && <p className="auth-error">{authError}</p>}
                <button className="submit-btn" onClick={handleRegister}>Create account</button>
                <p className="switch-text">Have an account? <span className="switch-link" onClick={() => setAuthTab("login")}>Sign in</span></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
