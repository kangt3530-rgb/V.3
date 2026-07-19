import { useEffect, useMemo, useRef, useState } from "react";
import type { ICriterionResponse, IPerRubricReport } from "../../api/types";
import { useRevisionStore } from "../../store/revisionStore";
import { useAI } from "../../hooks/useAI";
import { CRITERION_CHIPS, GENERAL_CHIPS } from "./aiChatChips";

interface AIChatboxProps {
  report: IPerRubricReport;
  responses: ICriterionResponse[];
  onClose: () => void;
}

export function AIChatbox({ report, responses, onClose }: AIChatboxProps) {
  const { aiChatCriterionId } = useRevisionStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeCriterion = aiChatCriterionId
    ? report.criteria.find((c) => c.criterionId === aiChatCriterionId)
    : null;
  const activeResponse = activeCriterion
    ? responses.find((r) => r.criterionId === aiChatCriterionId) ?? null
    : null;

  const systemPrompt = useMemo(() => {
    if (!activeCriterion) {
      return `You are an AI assistant helping an OER author understand feedback on their educational resource "${report.oer.title}" under the "${report.rubricName}" review. Answer questions about any criterion in the review.`;
    }
    const annotations = activeCriterion.annotations
      .map((a) => `- ${a.comment} (from: "${a.anchor.selectedText.slice(0, 80)}")`)
      .join("\n");
    return `You are an AI assistant helping an OER author understand reviewer feedback on their educational resource.

Criterion: ${activeCriterion.criterionId} — ${activeCriterion.criterionTitle}
Definition: ${activeCriterion.criterionStandard}
${activeCriterion.overallComment ? `\nReviewer's overall comment:\n"${activeCriterion.overallComment}"` : ""}
${annotations ? `\nAnnotations:\n${annotations}` : ""}
${activeResponse?.revisionLog ? `\nAuthor's revision log so far:\n"${activeResponse.revisionLog}"` : ""}

Help the author understand the feedback and suggest concrete improvements. Be constructive. Keep responses to 2–4 paragraphs. Do not write their revision log for them.

Conversation behavior:
- If the user greets you casually (hi, hello, hey), greet them back briefly and ask how you can help with this criterion. Do NOT immediately start analyzing the feedback.
- Wait for the user to ask a specific question before providing detailed analysis.
- Keep responses concise — 2-3 short paragraphs max unless the user asks for more detail.
- Use plain language, not academic jargon, unless the user asks for technical depth.
- Format your responses with short paragraphs. Use bullet points only when listing specific action items.
- Do not start responses with "This feedback provides..." or similar — speak directly to the user.`;
  }, [activeCriterion, activeResponse, report]);

  const { messages, sendMessage, isLoading, error, clearHistory } = useAI(systemPrompt);

  // Clear history when criterion context changes
  const prevCriterionRef = useRef(aiChatCriterionId);
  useEffect(() => {
    if (prevCriterionRef.current !== aiChatCriterionId) {
      prevCriterionRef.current = aiChatCriterionId;
      clearHistory();
    }
  }, [aiChatCriterionId, clearHistory]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    sendMessage(text);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const chips = activeCriterion ? CRITERION_CHIPS : GENERAL_CHIPS;
  const showChips = messages.length < 2;

  const contextLabel = activeCriterion
    ? `${activeCriterion.criterionId} · ${activeCriterion.criterionTitle}`
    : `${report.rubricName} · ${report.criteria.length} criteria`;

  const inputPlaceholder = activeCriterion
    ? "Ask about this criterion…"
    : "Ask about this review…";

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden print-hidden">

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💬</span>
            <p className="text-base font-semibold text-gray-800">AI Assistant</p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Expand (coming soon)" tabIndex={-1}>
              <span className="material-symbols-outlined text-[16px]">open_in_full</span>
            </button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Context indicator */}
      <div className="flex-shrink-0 mx-3 mt-3 bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2 min-w-0">
        <span className="text-xs flex-shrink-0">📍</span>
        <span className="text-xs text-gray-500 truncate">{contextLabel}</span>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-8 pb-4 space-y-2 text-center">
            <span className="text-3xl">💬</span>
            <p className="text-sm font-semibold text-gray-700">AI Assistant</p>
            <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
              Ask me anything about this review. I can help you understand feedback, suggest
              changes, or help you phrase your revision notes.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-50 text-blue-900 max-w-[75%]"
                  : "bg-gray-50 text-gray-800 max-w-[85%]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 rounded-2xl px-3 py-2.5">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 rounded-md px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick action chips */}
      {showChips && (
        <div
          className="flex-shrink-0 px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {chips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => sendMessage(chip.message)}
              disabled={isLoading}
              className="flex-none rounded-full bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={inputPlaceholder}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none transition-colors disabled:opacity-60 resize-none overflow-hidden leading-relaxed"
          style={{ minHeight: "36px" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
        </button>
      </div>

    </div>
  );
}
