"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import {
  Send,
  Loader2,
  Image as ImageIcon,
  Mic,
  MicOff,
  X,
  CheckCircle2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ExtractedTea {
  nameEnglish: string;
  nameNative: string | null;
  teaType: string;
  vendorName: string | null;
  region: string | null;
  country: string | null;
  prefecture: string | null;
  tastingNotes: string[];
  rating: number | null;
  personalNotes: string | null;
  caffeineLevel: string | null;
  bitter: boolean;
  sweet: boolean;
  grassy: boolean;
  floral: boolean;
  earthy: boolean;
  umami: boolean;
}

interface FollowUp {
  field: string;
  question: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
}

interface SavedTea {
  id: string;
  slug: string;
  nameNative: string;
  nameEnglish: string | null;
  vendor: string | null;
  category: string | null;
  tastingNotes: string[];
  rating: number | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export function TeaLogChat({ onTeaLogged }: { onTeaLogged?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedTea | null>(null);
  const [drinkAgainRating, setDrinkAgainRating] = useState<0 | 1 | 2 | null>(null); // 0 = wouldn't, 1 = would again, 2 = every day
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [savedTea, setSavedTea] = useState<SavedTea | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  /** Ref so onend callback can see current "user wants dictation on" state (avoids stale closure). */
  const dictationActiveRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, followUps, savedTea]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [input]);

  // ── Image handling ─────────────────────────────────────────────────────
  // HEIC (e.g. from iPhone) is not supported by browsers or Claude API;
  // convert to JPEG for preview and upload.

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      /\.heic$/i.test(file.name) ||
      /\.heif$/i.test(file.name);

    let blobToPreview: Blob = file;

    if (isHeic) {
      try {
        // Dynamic import so heic2any (which uses window) never runs during SSR
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.92,
        });
        blobToPreview = Array.isArray(converted) ? converted[0] : converted;
      } catch (err) {
        console.error("HEIC conversion failed:", err);
        setError("Could not convert photo. Try a JPEG or PNG.");
        e.target.value = "";
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setError(null);
      setImagePreview(result);
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(blobToPreview);
    e.target.value = "";
  }

  function clearImage() {
    setImageBase64(null);
    setImagePreview(null);
  }

  // ── Voice dictation (browser Web Speech API; no Anthropic / server STT) ───

  function toggleDictation() {
    if (isListening) {
      dictationActiveRef.current = false;
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SpeechRecognitionCtor = W.SpeechRecognition || W.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = input;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          setInput(finalTranscript);
        } else {
          interim += transcript;
        }
      }
      if (interim) {
        setInput(finalTranscript + interim);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      dictationActiveRef.current = false;
      setIsListening(false);
      const err = event.error;
      const msg =
        err === "not-allowed" || err === "service-not-allowed"
          ? "Microphone access denied. Allow mic in browser settings and try again."
          : err === "no-speech"
            ? null
            : err === "aborted"
              ? null
              : err === "network"
                ? "Voice disconnected (common in Cursor’s preview). Open this app in Chrome or Edge at localhost for dictation."
                : err === "audio-capture"
                  ? "Microphone not found or in use. Try another mic or close other apps using it."
                  : err === "language-not-supported"
                    ? "Voice input isn't available for this language."
                    : "Voice input failed. Check your connection and mic, then try again.";
      if (msg) setError(msg);
    };

    recognition.onend = () => {
      // Don't auto-restart — it often triggers "Connection lost" in many environments.
      // User can tap the mic again to continue dictating.
      dictationActiveRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    dictationActiveRef.current = true;
    setIsListening(true);
    try {
      recognition.start();
    } catch (err) {
      dictationActiveRef.current = false;
      setIsListening(false);
      setError("Could not start microphone. Check permissions.");
    }
  }

  // ── Send message ───────────────────────────────────────────────────────

  async function handleSend(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text && !imageBase64) return;
    if (loading) return;

    // Stop dictation if active
    if (isListening) {
      dictationActiveRef.current = false;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: text || "(photo uploaded)",
      imagePreview: imagePreview || undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setError(null);
    setLoading(true);

    // Build API messages (just role + content)
    const apiMessages = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/log-tea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "analyze",
          messages: apiMessages,
          image: imageBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze");

      setExtracted(data.extracted);
      setFollowUps(data.followUps || []);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.summary || "Got it!",
      };
      setMessages([...updatedMessages, assistantMessage]);

      // Keep image in state so we can upload it to MinIO when user clicks Save
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // ── Save tea ───────────────────────────────────────────────────────────

  async function handleSave() {
    if (!extracted || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/log-tea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "save",
          extracted: {
            ...extracted,
            rating: drinkAgainRating ?? extracted.rating,
          },
          image: imageBase64 ?? undefined,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.imagePreview ? { imagePreview: "(photo)" } : {}),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      clearImage(); // clear image from input area when we save
      setSavedTea(data.tea);
      onTeaLogged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  // ── Reset for new log ─────────────────────────────────────────────────

  function handleReset() {
    setMessages([]);
    setInput("");
    setImageBase64(null);
    setImagePreview(null);
    setExtracted(null);
    setDrinkAgainRating(null);
    setFollowUps([]);
    setSavedTea(null);
    setError(null);
    inputRef.current?.focus();
  }

  // ── Key handler ────────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const isEmpty = messages.length === 0 && !savedTea;

  return (
    <div className="flex h-full flex-col">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 text-4xl text-accent/50" aria-hidden>
              茶
            </span>
            <h3 className="text-lg font-semibold text-foreground">
              What are you drinking?
            </h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Describe your tea, snap a photo, or just talk — we&apos;ll
              organize it for your journal.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-3 flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-accent text-white"
                  : "bg-warm-highlight text-foreground"
              }`}
            >
              {msg.imagePreview && (
                <img
                  src={msg.imagePreview}
                  alt="Uploaded tea"
                  className="mb-2 max-h-40 rounded-lg object-cover"
                />
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="mb-3 flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-warm-highlight px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Thinking…
            </div>
          </div>
        )}

        {/* Follow-up questions */}
        {followUps.length > 0 && !savedTea && !loading && (
          <div className="mb-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {followUps.map((fq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(fq.question.replace("?", ": "))}
                  className="rounded-full border border-accent/30 bg-accent-light px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  {fq.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Extracted data preview — summary only; actions are in the input area below */}
        {extracted && !savedTea && !loading && (
          <div className="mb-3 rounded-xl border border-card-border bg-card p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Ready to log
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {extracted.teaType && (
                <span className="rounded-full bg-accent-light px-2.5 py-1 font-medium text-accent">
                  {extracted.teaType}
                </span>
              )}
              {extracted.vendorName && (
                <span className="rounded-full border border-card-border px-2.5 py-1 text-muted-foreground">
                  {extracted.vendorName}
                </span>
              )}
              {(extracted.region || extracted.country) && (
                <span className="rounded-full border border-card-border px-2.5 py-1 text-muted-foreground">
                  {[extracted.region, extracted.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
              {extracted.tastingNotes?.map((note) => (
                <span
                  key={note}
                  className="rounded-full bg-warm-highlight px-2.5 py-1 text-muted-foreground"
                >
                  {note}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {extracted.nameEnglish || extracted.nameNative || "Unnamed tea"}
              {extracted.personalNotes && ` — "${extracted.personalNotes}"`}
            </p>
          </div>
        )}

        {/* Saved confirmation */}
        {savedTea && (
          <div className="mb-3 rounded-xl border border-accent/30 bg-accent-light p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 size-8 text-accent" />
            <h4 className="font-semibold text-foreground">
              {savedTea.nameEnglish || savedTea.nameNative}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Added to your journal
              {savedTea.vendor ? ` · ${savedTea.vendor}` : ""}
              {savedTea.category ? ` · ${savedTea.category}` : ""}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Log another tea
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area — sticky bottom */}
      {!savedTea && (
        <div className="border-t border-card-border bg-card px-4 pb-4 pt-3">
          {/* When extracted: rating + Save in input area instead of card */}
          {extracted && !loading ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Would you drink it again?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDrinkAgainRating(0)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    drinkAgainRating === 0
                      ? "border-accent bg-accent-light text-accent"
                      : "border-card-border text-muted-foreground hover:bg-warm-highlight hover:text-foreground"
                  }`}
                >
                  I wouldn&apos;t
                </button>
                <button
                  type="button"
                  onClick={() => setDrinkAgainRating(1)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    drinkAgainRating === 1
                      ? "border-accent bg-accent-light text-accent"
                      : "border-card-border text-muted-foreground hover:bg-warm-highlight hover:text-foreground"
                  }`}
                >
                  I would drink it again
                </button>
                <button
                  type="button"
                  onClick={() => setDrinkAgainRating(2)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    drinkAgainRating === 2
                      ? "border-accent bg-accent-light text-accent"
                      : "border-card-border text-muted-foreground hover:bg-warm-highlight hover:text-foreground"
                  }`}
                >
                  I would drink it every day
                </button>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                <CheckCircle2 className="size-4" />
                Save to journal
              </button>
            </div>
          ) : (
            <>
              {/* Image preview — cleared when we save */}
              {imagePreview && (
            <div className="relative mb-2 inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-16 w-16 rounded-lg border border-card-border object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background"
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          {error && (
            <p className="mb-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Photo button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-card-border text-muted-foreground transition-colors hover:bg-warm-highlight hover:text-foreground"
              title="Add photo"
            >
              <ImageIcon className="size-4" />
            </button>

            {/* Voice button */}
            <button
              type="button"
              onClick={toggleDictation}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                isListening
                  ? "border-red-400 bg-red-50 text-red-500 dark:border-red-500 dark:bg-red-950/30"
                  : "border-card-border text-muted-foreground hover:bg-warm-highlight hover:text-foreground"
              }`}
              title={isListening ? "Stop dictation" : "Dictate"}
            >
              {isListening ? (
                <MicOff className="size-4" />
              ) : (
                <Mic className="size-4" />
              )}
            </button>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                messages.length === 0
                  ? "I just had this amazing matcha from…"
                  : "Add more details…"
              }
              disabled={loading}
              className="min-h-[40px] flex-1 resize-none rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={loading || (!input.trim() && !imageBase64)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </form>
            </>
          )}

          {isListening && (
            <p className="mt-1.5 text-center text-xs text-red-500 animate-pulse">
              Listening…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
