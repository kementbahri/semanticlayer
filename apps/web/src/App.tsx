import { useState } from 'react';
import { Sparkles, Layers, Activity, FileText } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('full');
  const [format, setFormat] = useState('slml');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, mode, format }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.errors?.[0] || 'Failed to extract content');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <header className="hero">
        <h1>SemanticLayer</h1>
        <p>The open protocol to transform the messy web into clean, AI-optimized data. Instantly extract token-efficient content from any SPA or static website.</p>
        
        <form onSubmit={handleExtract} className="search-container glass-panel">
          <input 
            type="url" 
            placeholder="https://react.dev/learn" 
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="select-mode">
            <option value="content">Content</option>
            <option value="structured">Structured</option>
            <option value="full">Full Page</option>
            <option value="raw">Raw HTML</option>
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="select-mode">
            <option value="slml">SLML</option>
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </select>
          <button type="submit" className="extract-btn" disabled={loading}>
            {loading ? <div className="loader"></div> : <><Sparkles size={20} /> Extract</>}
          </button>
        </form>
      </header>

      {error && (
        <div className="glass-panel" style={{ padding: '1.5rem', color: 'var(--danger-color)', textAlign: 'center', marginTop: '2rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="results-grid">
          <aside className="meta-card glass-panel">
            <h3 className="meta-title">Extraction Details</h3>
            
            <div className="meta-stat">
              <span className="stat-label">Title</span>
              <span className="stat-value" style={{textAlign:'right', maxWidth:'150px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={result.metadata.title}>{result.metadata.title || 'N/A'}</span>
            </div>
            <div className="meta-stat">
              <span className="stat-label">Framework</span>
              <span className="stat-value" style={{ textTransform: 'capitalize', color: 'var(--accent-color)' }}>{result.metadata.frameworkDetected || 'Static'}</span>
            </div>
            <div className="meta-stat">
              <span className="stat-label">Engine</span>
              <span className="stat-value">{result.renderEngine}</span>
            </div>
            <div className="meta-stat">
              <span className="stat-label">Time</span>
              <span className="stat-value">{result.timing.totalMs}ms</span>
            </div>
            
            <div style={{ margin: '2rem 0', borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
              <div className="meta-stat" style={{ marginBottom: '1rem' }}>
                <span className="stat-label">Original Tokens</span>
                <span className="stat-value">{result.metadata.originalTokensEstimate.toLocaleString()}</span>
              </div>
              <div className="meta-stat" style={{ marginBottom: '1rem' }}>
                <span className="stat-label">Optimized Tokens</span>
                <span className="stat-value" style={{ color: 'var(--success-color)' }}>{result.metadata.estimatedTokens.toLocaleString()}</span>
              </div>
              <div className="meta-stat">
                <span className="stat-label">Savings</span>
                <span className="stat-savings">{result.metadata.tokenSavingsPercent}%</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '2rem' }}>
              <div className="meta-stat"><span className="stat-label"><FileText size={16} /> Words</span> <span className="stat-value">{result.metadata.wordCount}</span></div>
              <div className="meta-stat"><span className="stat-label"><Layers size={16} /> Elements</span> <span className="stat-value">{result.metadata.headings.length + result.metadata.imagesCount + result.metadata.codeBlocksCount}</span></div>
              <div className="meta-stat"><span className="stat-label"><Activity size={16} /> Links</span> <span className="stat-value">{result.metadata.linksCount}</span></div>
            </div>
          </aside>

          <main className="output-card glass-panel">
            <div className="output-header">
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--accent-color)" /> Output
              </span>
              <div className="output-tabs">
                <button className="tab active">{result.format.toUpperCase()}</button>
              </div>
            </div>
            <div className="code-area">
              {result.content}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
