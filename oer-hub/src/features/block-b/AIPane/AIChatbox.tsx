import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { callGeminiStream, buildSystemPrompt, buildR4Prompt } from "../../../api/ai";
import type { AIFeatureContext, ChatMessage, CommentNudgeContext } from "../../../api/ai";
import { useReviewStore } from "../../../store/reviewStore";
import handbookRaw from "../../../data/handbook.md?raw";

function buildTermLookupSystemPrompt(rubricName: string, rubricFullText: string): string {
  return `You are an expert OER (Open Educational Resources) review assistant embedded in the Open 4 Peer Review platform. Your job is to help peer reviewers understand rubric terminology precisely so they can write accurate, well-grounded feedback.

YOUR KNOWLEDGE BASE
You have been provided with the full text of the active rubric document as context.

Active rubric: ${rubricName}

Rubric document:
${rubricFullText}

RESPONSE RULES
ALWAYS look for the term's definition in the rubric document first. If the glossary or criteria descriptions contain a definition or usage of this term, quote or closely paraphrase that rubric language as your primary source.

Structure your response as follows:
[Term]
[Definition grounded in the rubric's own language. 2–4 sentences. If the rubric defines it explicitly, quote it and cite which section it appears in.]

In this rubric:
[1–2 sentences explaining how this term is used within the specific criteria of the active rubric template — which criterion it appears in, and what the reviewer is expected to evaluate.]

After your definition, offer 2–3 SHORT follow-up questions the reviewer might want to explore, grounded in the actual OER content. Frame them as invitations, not prompts.

If the term does not appear in the rubric document at all, say: "This term isn't defined in the ${rubricName} rubric. Here's a general definition to orient you:" — then provide a brief general definition.

Keep the total response under 200 words. Be precise, not exhaustive.
Do NOT offer to write feedback for the reviewer. Do NOT rate or judge the OER. Your role is definitional and orientational only.`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RUBRIC_NAMES: Record<string, string> = {
  accessibility:  "Accessibility",
  "copy-editing": "Copy Editing",
  copyright:      "Copyright",
  disciplinary:   "Disciplinary Appropriateness",
  elearning:      "eLearning",
  udl:            "Universal Design for Learning (UDL)",
};

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm here to help with your review. You can ask me about rubric criteria, what a standard means, how to phrase feedback, or anything else related to your evaluation.",
};

// ─── AIChatbox ───────────────────────────────────────────────────────────────

export function AIChatbox() {
  const chatHistory          = useReviewStore((s) => s.chatHistory);
  const aiPaneOpen           = useReviewStore((s) => s.aiPaneOpen);
  const rubricId             = useReviewStore((s) => s.rubricTemplateId);
  const addChatMessage       = useReviewStore((s) => s.addChatMessage);
  const setChatHistory       = useReviewStore((s) => s.setChatHistory);
  const toggleAIPane         = useReviewStore((s) => s.toggleAIPane);
  const setAIPaneOpen        = useReviewStore((s) => s.setAIPaneOpen);
  const pendingLookup          = useReviewStore((s) => s.pendingLookup);
  const clearPendingLookup     = useReviewStore((s) => s.clearPendingLookup);
  const rubricFullText         = useReviewStore((s) => s.rubricFullText);
  const toggleLookupCollapse   = useReviewStore((s) => s.toggleLookupCollapse);
  const activeCriterionId      = useReviewStore((s) => s.activeCriterionId);
  const activeCriterionTitle   = useReviewStore((s) => s.activeCriterionTitle);
  const activeCommentNudge     = useReviewStore((s) => s.activeCommentNudge);
  const clearActiveCommentNudge = useReviewStore((s) => s.clearActiveCommentNudge);
  const appendToCommentField   = useReviewStore((s) => s.appendToCommentField);

  const [input, setInput]               = useState("");
  const [streaming, setStreaming]       = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [welcomed, setWelcomed]         = useState(false);

  const endRef      = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Seed the welcome message once the pane first opens
  useEffect(() => {
    if (aiPaneOpen && !welcomed) {
      setWelcomed(true);
      if (chatHistory.length === 0) setChatHistory([WELCOME]);
    }
  }, [aiPaneOpen, welcomed, chatHistory.length, setChatHistory]);

  // Auto-scroll to latest message or streaming chunk
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingText]);

  // R1: fire term lookup stream when dispatched from AnnotationPopover
  useEffect(() => {
    if (!pendingLookup) return;
    if (streaming) { clearPendingLookup(); return; }
    const { term } = pendingLookup;
    clearPendingLookup();
    setStreaming(true);
    setStreamingText("");
    const history = useReviewStore.getState().chatHistory;
    const fullTextRef = { current: "" };
    void callGeminiStream(
      history,
      buildTermLookupSystemPrompt(rubricName, rubricFullText),
      (chunk) => {
        fullTextRef.current += chunk;
        setStreamingText(fullTextRef.current);
      }
    ).then(() => {
      addChatMessage({
        role: "assistant",
        content: fullTextRef.current || "Sorry, I couldn't generate a response.",
        type: "term_lookup",
        term,
        collapsed: false,
      });
      setStreaming(false);
      setStreamingText("");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLookup]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto-resize up to 4 lines (~96px)
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
  }

  const rubricName = RUBRIC_NAMES[rubricId] ?? rubricId;

  const getSystemPrompt = useCallback((): string => {
    const ctx: AIFeatureContext = { rubricName };
    return buildSystemPrompt(ctx, handbookRaw);
  }, [rubricName]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    addChatMessage(userMsg);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setStreaming(true);
    setStreamingText("");

    // Build message list including the just-sent user message
    const history = [...chatHistory, userMsg];
    let fullText = "";

    await callGeminiStream(history, getSystemPrompt(), (chunk) => {
      fullText += chunk;
      setStreamingText(fullText);
    });

    addChatMessage({
      role: "assistant",
      content: fullText || "Sorry, I couldn't generate a response.",
    });
    setStreaming(false);
    setStreamingText("");
  }, [input, streaming, chatHistory, addChatMessage, getSystemPrompt]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleClear() {
    setChatHistory([WELCOME]);
  }

  const handleR4Chip = useCallback(async () => {
    if (streaming) return;

    const criterion =
      activeCriterionId && activeCriterionTitle
        ? { id: activeCriterionId, title: activeCriterionTitle }
        : undefined;

    const userContent = buildR4Prompt(rubricName, criterion);
    const criterionLabel = criterion ? ` for ${criterion.title}` : "";
    const userMsg: ChatMessage = {
      role: "user",
      content: userContent,
      displayContent: `Show me the standards reference${criterionLabel}.`,
    };
    addChatMessage(userMsg);
    setStreaming(true);
    setStreamingText("");

    const history = [...chatHistory, userMsg];
    let fullText = "";

    await callGeminiStream(history, getSystemPrompt(), (chunk) => {
      fullText += chunk;
      setStreamingText(fullText);
    });

    addChatMessage({
      role: "assistant",
      content: fullText || "Sorry, I couldn't generate a response.",
      type: "r4_standards",
      collapsed: false,
    });
    setStreaming(false);
    setStreamingText("");
  }, [streaming, activeCriterionId, activeCriterionTitle, rubricName, chatHistory, addChatMessage, getSystemPrompt]);

  // ── COLLAPSED rail ────────────────────────────────────────────────────────────
  if (!aiPaneOpen) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label="Open AI Assistant"
        title="AI Assistant"
        onClick={toggleAIPane}
        onKeyDown={(e) => { if (e.key === "Enter") toggleAIPane(); }}
        className="flex flex-col items-center justify-center w-10 flex-shrink-0 h-full bg-surface-container-low border-l border-outline-variant/20 cursor-pointer hover:bg-surface-container transition-colors group"
      >
        <span
          className="material-symbols-outlined text-[22px] text-secondary group-hover:text-primary transition-colors"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
      </div>
    );
  }

  // ── EXPANDED panel ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-80 flex-shrink-0 h-full bg-surface-container-low border-l border-outline-variant/20">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[18px] text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span className="text-label-md font-label font-semibold tracking-widest text-on-surface">
            AI Assistant
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleClear}
            className="text-label-sm font-label text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded"
          >
            Clear
          </button>
          <button
            onClick={() => setAIPaneOpen(false)}
            aria-label="Close AI Assistant"
            className="p-1 rounded hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3">
        {chatHistory.map((msg, i) => (
          <Bubble
            key={i}
            msg={msg}
            onToggleCollapse={(msg.type === "term_lookup" || msg.type === "r4_standards") ? () => toggleLookupCollapse(i) : undefined}
          />
        ))}

        {streaming && (
          streamingText
            ? <Bubble msg={{ role: "assistant", content: streamingText }} />
            : <TypingDots />
        )}

        <div ref={endRef} />
      </div>

      {/* R3+R16 comment nudge panel */}
      {activeCommentNudge && (
        <CommentNudgePanel
          nudge={activeCommentNudge}
          onDismiss={clearActiveCommentNudge}
          onInsertStarter={(text) =>
            appendToCommentField(activeCommentNudge.criterionId, activeCommentNudge.fieldType, text)
          }
        />
      )}

      {/* Input area */}
      <div className="flex-shrink-0 p-3 border-t border-outline-variant/20">
        {/* Preset chips */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={() => void handleR4Chip()}
            disabled={streaming}
            className="flex items-center gap-1 px-2.5 py-1 bg-surface-container text-secondary border border-outline-variant/30 rounded-full text-label-sm font-label hover:bg-surface-container-high transition-colors disabled:opacity-40"
          >
            📋 Standards Reference
          </button>
        </div>
        <div className="flex items-end gap-2 bg-surface rounded-lg px-3 py-2 border border-outline-variant/30 focus-within:border-secondary/60 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            placeholder="Ask about this criterion…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none leading-5 disabled:opacity-50"
            style={{ maxHeight: "96px" }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={streaming || !input.trim()}
            aria-label="Send"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded bg-secondary text-on-secondary disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {streaming
              ? <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
            }
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-on-surface-variant/40 text-center font-label tracking-wide">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string): ReactNode[] {
  // Match: **[text](url)**, **text**, [text](url), *text* — in that priority order
  const pattern = /\*\*\[([^\]]+)\]\(([^)]+)\)\*\*|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|\*([^*]+)\*/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));

    if (match[1] && match[2]) {
      // **[bold link](url)**
      nodes.push(
        <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer"
           className="font-semibold text-secondary underline underline-offset-2 hover:text-primary transition-colors">
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      // **bold**
      nodes.push(<strong key={key++} className="font-semibold">{match[3]}</strong>);
    } else if (match[4] && match[5]) {
      // [link](url)
      nodes.push(
        <a key={key++} href={match[5]} target="_blank" rel="noopener noreferrer"
           className="text-secondary underline underline-offset-2 hover:text-primary transition-colors">
          {match[4]}
        </a>
      );
    } else if (match[6]) {
      // *italic*
      nodes.push(<em key={key++}>{match[6]}</em>);
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function MarkdownText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        const trimmed = line.trimStart();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (/^#{1,4}\s/.test(trimmed)) {
          const content = trimmed.replace(/^#+\s*/, "");
          return (
            <p key={i} className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary mt-2 mb-0.5">
              {renderInline(content)}
            </p>
          );
        }
        if (trimmed.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="flex-shrink-0 w-1 h-1 rounded-full bg-on-surface-variant/50 mt-[7px]" />
              <span className="leading-relaxed">{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i} className="leading-relaxed">{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Bubble({ msg, onToggleCollapse }: { msg: ChatMessage; onToggleCollapse?: () => void }) {
  const isUser = msg.role === "user";

  if (msg.type === "term_lookup" || msg.type === "r4_standards") {
    const isR4 = msg.type === "r4_standards";
    const icon = isR4 ? "library_books" : "menu_book";
    const label = isR4 ? "Standards Reference" : (msg.term ?? "");

    if (msg.collapsed) {
      return (
        <div className="flex justify-start">
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-2 px-3 py-2 bg-surface rounded-xl rounded-bl-sm shadow-sm border border-outline-variant/20 text-body-sm text-secondary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            <span className={isR4 ? "font-semibold" : "italic"}>{label}</span>
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>
        </div>
      );
    }
    return (
      <div className="flex justify-start">
        <div className="max-w-[88%] bg-surface text-on-surface rounded-xl rounded-bl-sm shadow-sm border border-outline-variant/20 overflow-hidden">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-between px-3 py-2 border-b border-outline-variant/20 hover:bg-surface-container transition-colors"
          >
            <span className="flex items-center gap-1.5 text-label-sm font-semibold text-secondary">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              {label}
            </span>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">expand_less</span>
          </button>
          <div className="px-3 py-2 text-body-sm">
            <MarkdownText text={msg.content} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] px-3 py-2 text-body-sm leading-relaxed rounded-xl ${
          isUser
            ? "bg-primary text-on-primary rounded-br-sm"
            : "bg-surface text-on-surface rounded-bl-sm shadow-sm border border-outline-variant/20"
        }`}
      >
        {isUser
          ? (msg.displayContent ?? msg.content)
          : <MarkdownText text={msg.content} />}
      </div>
    </div>
  );
}

function CommentNudgePanel({
  nudge,
  onDismiss,
  onInsertStarter,
}: {
  nudge: CommentNudgeContext;
  onDismiss: () => void;
  onInsertStarter: (text: string) => void;
}) {
  return (
    <div className="flex-shrink-0 border-t border-amber-200/60 bg-amber-50/30 px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-label font-semibold text-amber-700 uppercase tracking-widest">
          <span>✦</span>
          Comment Suggestions
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[10px] font-label text-on-surface-variant/60 hover:text-on-surface transition-colors"
        >
          Looks good, dismiss
        </button>
      </div>

      {nudge.r3 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-label font-semibold text-amber-700">
            Tone: {nudge.r3.diagnosis}
          </p>
          {nudge.r3.problematicPhrase && (
            <p className="text-[10px] text-on-surface-variant bg-amber-100/70 border border-amber-200/60 px-2 py-1 rounded italic">
              "{nudge.r3.problematicPhrase}"
            </p>
          )}
          {nudge.r3.reflectiveQuestion && (
            <p className="text-body-sm text-on-surface-variant/80 italic leading-snug">
              {nudge.r3.reflectiveQuestion}
            </p>
          )}
          {nudge.r3.sentenceStarter && (
            <button
              type="button"
              onClick={() => onInsertStarter(nudge.r3!.sentenceStarter!)}
              className="inline-flex items-center px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-800 rounded-full text-[10px] font-label hover:bg-amber-200 transition-colors text-left"
            >
              {nudge.r3.sentenceStarter}
            </button>
          )}
        </div>
      )}

      {nudge.r16 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-label font-semibold text-blue-600">
            Evidence: {nudge.r16.diagnosis}
          </p>
          {nudge.r16.reflectiveQuestion && (
            <p className="text-body-sm text-on-surface-variant/80 italic leading-snug">
              {nudge.r16.reflectiveQuestion}
            </p>
          )}
          {nudge.r16.sentenceStarters.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {nudge.r16.sentenceStarters.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onInsertStarter(starter)}
                  className="inline-flex items-center px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[10px] font-label hover:bg-blue-100 transition-colors text-left"
                >
                  {starter}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-surface rounded-xl rounded-bl-sm px-4 py-3 shadow-sm border border-outline-variant/20 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
