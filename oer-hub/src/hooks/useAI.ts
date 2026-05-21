import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

export function useAI(systemPrompt: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(userText: string): Promise<void> {
    const userMsg: ChatMessage = {
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    const contents = [...messages, userMsg].map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { maxOutputTokens: 1024 },
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${res.status}: ${err}`);
      }
      const data = await res.json();
      const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: text, timestamp: new Date().toISOString() },
      ]);
    } catch (e) {
      console.error("[useAI] error:", e);
      setError("Sorry, I couldn't process that request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function clearHistory() {
    setMessages([]);
  }

  return { messages, sendMessage, isLoading, error, clearHistory };
}
