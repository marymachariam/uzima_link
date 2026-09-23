"use client";

import { useState } from "react";
import { sendAssistantMessage } from "@/lib/endpoints";
import styles from "./AssistantWidget.module.css";

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm here to help you use Uzima Link. Ask me anything about the app." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages((m) => [...m, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendAssistantMessage(userMessage);
      setMessages((m) => [...m, { role: "bot", text: res.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} className={styles.fab} aria-label="Open help assistant">
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>Uzima Link Assistant</div>
          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? styles.userBubble : styles.botBubble}>
                {m.text}
              </div>
            ))}
            {loading && <div className={styles.botBubble}>Typing...</div>}
          </div>
          <form onSubmit={handleSend} className={styles.inputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className={styles.input}
            />
            <button type="submit" disabled={loading} className={styles.sendButton}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}