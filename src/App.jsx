import React, { useState } from 'react';
import './index.css';

const PRESETS = [
  { label: 'Framer (Series C)', url: 'framer.com' },
  { label: 'Stripe (Pre-IPO)', url: 'stripe.com' },
  { label: 'Webflow ($335M)', url: 'webflow.com' },
  { label: 'Linear ($52M)', url: 'linear.app' },
  { label: 'Crisp (Bootstrapped)', url: 'crisp.chat' },
];

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const analyze = async (targetUrl) => {
    const query = targetUrl || url;
    if (!query) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:5001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: query })
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
        if (!targetUrl) setUrl(query);
      }
    } catch {
      setError('Cannot connect to backend server on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const copyBrief = () => {
    if (!data) return;
    const brief = `=== LEAD EVALUATION: ${data.identity.brand || data.domain} ===
Verdict: ${data.qualification.status} (${data.qualification.score}/100)
Action: ${data.qualification.action}

Financials:
• Team Size: ${data.companyProfile.teamSize}
• Location: ${data.companyProfile.location}
• Funding: ${data.companyProfile.funding.stage} (${data.companyProfile.funding.totalRaised})
• Investors: ${data.companyProfile.funding.leadInvestors.join(', ')}
• Est. SaaS Spend: ${data.qualification.estimatedSaaSBudget}

Founders:
${data.founders.map(f => `• ${f.name} (${f.role}) - ${f.linkedin || 'No LinkedIn'}`).join('\n')}

Math Formula:
${data.mathCalculation.formula}`;

    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <span className="logo">⚡</span>
          <div>
            <h1>LeadVal</h1>
            <p>Will they afford your premium service? Know before the meeting.</p>
          </div>
        </div>
      </header>

      {/* Simple Search Input */}
      <div className="search-box">
        <form onSubmit={(e) => { e.preventDefault(); analyze(); }} className="search-bar">
          <input
            type="text"
            placeholder="Enter website URL (e.g. framer.com, stripe.com, crisp.chat)..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !url}>
            {loading ? 'Scanning...' : 'Check Lead'}
          </button>
        </form>

        <div className="presets">
          <span className="presets-title">Try sample:</span>
          {PRESETS.map((p) => (
            <button
              key={p.url}
              type="button"
              className="preset-btn"
              onClick={() => { setUrl(p.url); analyze(p.url); }}
              disabled={loading}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* Results View */}
      {data && (
        <div className="results">
          {/* Main Verdict Card */}
          <div className={`verdict-card ${data.qualification.score >= 75 ? 'pass' : data.qualification.score >= 52 ? 'review' : 'fail'}`}>
            <div className="verdict-top">
              <div>
                <span className="verdict-tag">MEETING VERDICT</span>
                <h2 className="verdict-status">
                  {data.qualification.score >= 75 ? '✅' : data.qualification.score >= 52 ? '⚠️' : '❌'}{' '}
                  {data.qualification.status}
                </h2>
                <p className="verdict-action">{data.qualification.action}</p>
              </div>

              <div className="score-pill">
                <span className="score-number">{data.qualification.score}</span>
                <span className="score-max">/100</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="quick-stats">
              <div className="stat">
                <span className="stat-label">LOCATION</span>
                <span className="stat-val">{data.companyProfile.location}</span>
              </div>
              <div className="stat">
                <span className="stat-label">TEAM SIZE</span>
                <span className="stat-val">{data.companyProfile.teamSize}</span>
              </div>
              <div className="stat">
                <span className="stat-label">FUNDING STAGE</span>
                <span className="stat-val">{data.companyProfile.funding.stage}</span>
              </div>
              <div className="stat">
                <span className="stat-label">EST. SAAS SPEND</span>
                <span className="stat-val">{data.qualification.estimatedSaaSBudget}</span>
              </div>
            </div>

            <div className="verdict-footer">
              <button onClick={copyBrief} className="btn-secondary">
                {copied ? '✓ Copied Brief to Clipboard' : '📋 Copy Meeting Brief'}
              </button>
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="btn-link">
                Open {data.domain} &rarr;
              </a>
            </div>
          </div>

          {/* Section 1: Math Score Breakdown */}
          <section className="section">
            <div className="section-header">
              <h3>🧮 Math Point Breakdown</h3>
              <span className="formula-chip">{data.mathCalculation.formula}</span>
            </div>

            <table className="simple-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Weight</th>
                  <th>Points</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {data.mathCalculation.scorecard.map((item, idx) => (
                  <tr key={idx}>
                    <td className="bold">{item.category}</td>
                    <td className="muted">{item.weight}</td>
                    <td className="bold">{item.pointsEarned} / {item.maxPoints}</td>
                    <td className="evidence">{item.proof}</td>
                  </tr>
                ))}
                {data.redFlags.length > 0 && (
                  <tr className="penalty">
                    <td className="bold text-danger">🚨 Red Flag Deductions</td>
                    <td className="muted">-</td>
                    <td className="bold text-danger">-{data.mathCalculation.totalPenalties}</td>
                    <td className="evidence text-danger">
                      {data.redFlags.map(r => `${r.title} (-${r.deduction}pts)`).join(', ')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Section 2: Founders & Leadership */}
          <section className="section">
            <div className="section-header">
              <h3>👥 Founders & Key Decision Makers</h3>
              <span className="badge">{data.founders.length} Identified</span>
            </div>

            <div className="founders-list">
              {data.founders.map((founder, idx) => (
                <div key={idx} className="founder-item">
                  <div className="founder-avatar">
                    {founder.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="founder-info">
                    <h4>{founder.name}</h4>
                    <span className="founder-role">{founder.role}</span>
                    <p className="founder-bio">{founder.bio}</p>
                  </div>
                  <div className="founder-buttons">
                    {founder.linkedin && (
                      <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="social-btn">
                        LinkedIn
                      </a>
                    )}
                    {founder.twitter && (
                      <a href={founder.twitter} target="_blank" rel="noopener noreferrer" className="social-btn">
                        Twitter / X
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Ad Video Links & Metrics */}
          <section className="section">
            <div className="section-header">
              <h3>🎬 Ad Videos & Acquisition Creatives</h3>
              <span className="badge">{data.advertising.socialVideos.totalPosted} Videos Published</span>
            </div>

            <div className="ad-links-bar">
              <span className="ad-links-title">Inspect Live Ad Libraries:</span>
              <a href={data.advertising.adLibraryLinks.meta} target="_blank" rel="noopener noreferrer" className="ad-link-btn">
                Meta (FB/IG) Ad Library &rarr;
              </a>
              <a href={data.advertising.adLibraryLinks.google} target="_blank" rel="noopener noreferrer" className="ad-link-btn">
                Google Ads Transparency &rarr;
              </a>
              <a href={data.advertising.adLibraryLinks.tiktok} target="_blank" rel="noopener noreferrer" className="ad-link-btn">
                TikTok Creative Center &rarr;
              </a>
            </div>

            <div className="videos-grid">
              {data.advertising.socialVideos.creatives.map((video, idx) => (
                <div key={idx} className="video-card">
                  <div className="video-top">
                    <span className="video-platform">{video.platform}</span>
                    <span className="video-eng">{video.engagement} Eng.</span>
                  </div>
                  <h4 className="video-title">{video.title}</h4>
                  <p className="video-hook">&ldquo;{video.hook}&rdquo;</p>
                  <div className="video-stats">
                    <div>
                      <span className="v-lbl">VIEWS</span>
                      <strong className="v-val">{video.views}</strong>
                    </div>
                    <div>
                      <span className="v-lbl">LIKES</span>
                      <strong className="v-val">{video.likes}</strong>
                    </div>
                    <div>
                      <span className="v-lbl">COMMENTS</span>
                      <strong className="v-val">{video.comments}</strong>
                    </div>
                  </div>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="video-btn">
                    View Creative &rarr;
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Funding & Tech Stack */}
          <section className="section">
            <div className="section-header">
              <h3>💰 Capital, Funding & Software Stack</h3>
              <span className="badge">{data.companyProfile.funding.stage}</span>
            </div>

            <div className="details-grid">
              <div className="detail-box">
                <span className="detail-lbl">TOTAL CAPITAL RAISED</span>
                <strong className="detail-val">{data.companyProfile.funding.totalRaised}</strong>
                <span className="detail-sub">
                  Backers: {data.companyProfile.funding.leadInvestors.join(', ')}
                </span>
              </div>

              <div className="detail-box">
                <span className="detail-lbl">ACTIVE AD PIXELS</span>
                <strong className="detail-val">
                  {data.advertising.hasActiveAdSpend ? `${data.advertising.adPixels.length} Active` : 'None'}
                </strong>
                <span className="detail-sub">
                  {data.advertising.adPixels.join(', ') || 'No retargeting tags found'}
                </span>
              </div>

              <div className="detail-box full-width">
                <span className="detail-lbl">DETECTED TECH STACK</span>
                <div className="tech-tags">
                  <span className="tech-tag primary">{data.techStack.platform}</span>
                  {data.techStack.detectedTools.map((t, idx) => (
                    <span key={idx} className="tech-tag">
                      {t.name} ({t.tier})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Empty State */}
      {!data && !loading && !error && (
        <div className="empty-state">
          <p>Enter any website above to instantly see if they have the budget for your premium service.</p>
        </div>
      )}
    </div>
  );
}

export default App;
