import { useState, useEffect, useRef } from "react";
import "./RAGInterface.css";

const BASE_URL = "/api";

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}>
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="14" fill="var(--accent)"/>
    <path d="M24 10 C16 10 11 16 11 24 C11 30 14.5 35 20 37 L20 34 C17 32.5 15 28.5 15 24 C15 18 19 14 24 14 C29 14 33 18 33 24 C33 28.5 31 32.5 28 34 L28 37 C33.5 35 37 30 37 24 C37 16 32 10 24 10Z" fill="white" opacity="0.95"/>
    <circle cx="24" cy="24" r="4" fill="white" opacity="0.9"/>
  </svg>
);

const ScoreBar = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = pct > 75 ? "#4caf89" : pct > 50 ? "#da7756" : "#aaa";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <span className="score-bar-label" style={{ color }}>{pct}%</span>
    </div>
  );
};

export default function RAGInterface() {
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexMsg, setIndexMsg] = useState(null);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    fetch(`${BASE_URL}/health`)
      .then(r => r.json())
      .then(d => setHealth(d.status))
      .catch(() => setHealth("unreachable"));
  }, []);

  const handleQuery = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`${BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), top_k: topK }),
      });
      const data = await res.json();
      if (data.status === "ok") setResults(data.results);
      else setError("Query failed.");
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  const handleIndex = async () => {
    setIndexing(true);
    setIndexMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/index`);
      const data = await res.json();
      setIndexMsg(`Indexed ${data.indexed ?? "?"} documents`);
      setTimeout(() => setIndexMsg(null), 3500);
    } catch {
      setIndexMsg("Indexing failed");
      setTimeout(() => setIndexMsg(null), 3000);
    } finally {
      setIndexing(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const statusClass =
    health === "ok" ? "status-dot status-dot--ok" :
    health === "unreachable" ? "status-dot status-dot--unreachable" :
    "status-dot status-dot--checking";

  if (!mounted) return null;

  return (
    <div className={`rag-root${dark ? " dark" : ""}`}>
      {/* Top Bar */}
      <header className="topbar">
        <div className="brand">
          <Logo />
          <span className="brand-name">RAG</span>
        </div>
        <div className="topbar-right">
          <div className={statusClass} title={`Server: ${health ?? "checking"}`} />
          <button className="theme-btn" onClick={() => setDark(d => !d)}>
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Hero */}
        <div className="hero">
          <div className="hero-logo"><Logo /></div>
          <h1 className="hero-greeting">Hi, how can I help?</h1>
          <p className="hero-sub">Ask anything across your indexed documents</p>
        </div>

        {/* Query Box */}
        <div className="query-wrapper">
          <div className="query-box">
            <textarea
              ref={textareaRef}
              className="query-textarea"
              placeholder="Ask a question about your documents…"
              value={query}
              onChange={e => { setQuery(e.target.value); autoResize(); }}
              onKeyDown={handleKey}
              rows={2}
            />
            <div className="query-footer">
              <div className="topk-control">
                <span className="topk-label">top_k</span>
                <input
                  className="topk-input"
                  type="number"
                  min={1}
                  max={20}
                  value={topK}
                  onChange={e => setTopK(Math.max(1, Math.min(100, +e.target.value)))}
                />
              </div>
              <div className="query-actions">
                <button className="btn-index" onClick={handleIndex} disabled={indexing}>
                  <RefreshIcon spinning={indexing} />
                  {indexing ? "Indexing…" : "Re-index"}
                </button>
                <button
                  className="btn-send"
                  onClick={handleQuery}
                  disabled={loading || !query.trim()}
                  title="Send (Enter)"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>

          {indexMsg && <p className="index-msg">✓ {indexMsg}</p>}
          {error && <p className="error-msg">{error}</p>}
        </div>

        {/* Results */}
        {loading && (
          <div className="results-section">
            <div className="loading-dots">
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          </div>
        )}

        {!loading && results !== null && (
          <div className="results-section">
            <p className="results-header">{results.length} result{results.length !== 1 ? "s" : ""}</p>
            {results.length === 0 && (
              <p className="empty-msg">No relevant documents found.</p>
            )}
            {results.map((r, i) => (
              <div key={i} className="result-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="result-meta">
                  <span className="result-rank">{r.payload.source}</span>
                  {r.score != null && <ScoreBar score={r.score} />}
                </div>
                <p className="result-text">{r.payload.text ?? r.content ?? JSON.stringify(r)}</p>
                {r.source && <p className="result-source">📄 {r.source}</p>}
                {r.metadata && Object.keys(r.metadata).length > 0 && (
                  <p className="result-source" style={{ marginTop: 4 }}>
                    {Object.entries(r.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
