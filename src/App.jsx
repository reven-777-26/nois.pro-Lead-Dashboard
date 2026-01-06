import React, { useState } from 'react';
import './index.css';

const DashboardBox = ({ title, value, detail, confidence, color, children, showRaw, rawData, onAdjust }) => (
  <div className="box">
    <div className="box-header">
      <span className="box-title">{title}</span>
      {confidence && <span className="confidence-chip">{confidence}</span>}
    </div>
    <div className="result-value" style={{ color: color || 'white' }}>
      {value}
    </div>
    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
      {detail}
    </div>

    {children}

    {onAdjust && (
      <div className="manual-adjust">
        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Manual Multiplier: </label>
        <input
          type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0"
          onChange={(e) => onAdjust(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent-primary)', height: '10px' }}
        />
      </div>
    )}

    {showRaw && rawData && (
      <div className="raw-data">
        <pre>{JSON.stringify(rawData, null, 2)}</pre>
      </div>
    )}
  </div>
);

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [adjustments, setAdjustments] = useState({
    traffic: 1.0,
    social: 1.0,
    brand: 1.0
  });

  const analyze = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
      alert('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = (type, val) => {
    setAdjustments(prev => ({ ...prev, [type]: val }));
  };

  const calculateFinalScore = () => {
    if (!data) return 0;
    const base = data.decision.score;
    const adjusted = base * adjustments.traffic * adjustments.social * adjustments.brand;
    return Math.min(100, Math.round(adjusted));
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Nois.pro</h1>
        <p>Code Export Lead Intelligence System (Free Version)</p>
      </div>

      <div className="dashboard">
        <div className="url-input-container">
          <input
            type="text"
            placeholder="Enter website URL (e.g. framer.com, webflow.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={analyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Deep Scan'}
          </button>
          <button
            onClick={() => setShowRaw(!showRaw)}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--card-border)' }}
          >
            {showRaw ? 'Hide Raw' : 'Show Raw'}
          </button>
        </div>

        {data && !data.error ? (
          <>
            <DashboardBox
              title="1. Identity & Platform"
              value={data.platform || 'Unknown'}
              detail={data.identity?.title || 'No title found'}
              confidence="100%"
              color="var(--accent-primary)"
              showRaw={showRaw}
              rawData={data.identity}
            />

            <DashboardBox
              title="2. Cost Estimation"
              value={`~$${data.costEstimation?.cost || 0}/mo`}
              detail={`Likely on ${data.costEstimation?.plan || 'Unknown'} plan`}
              confidence={data.costEstimation?.confidence}
              color="var(--warning)"
              showRaw={showRaw}
              rawData={data.costEstimation}
            />

            <DashboardBox
              title="3. Website Traffic"
              value={data.traffic?.tier || 'Low'}
              detail={`Range: ${data.traffic?.range || '< 10k'} visits. ${data.traffic?.scripts || 0} scripts detected.`}
              confidence="Heuristic"
              color="var(--accent-secondary)"
              showRaw={showRaw}
              rawData={data.traffic}
              onAdjust={(val) => handleAdjust('traffic', val)}
            />

            <DashboardBox
              title="4. Social Intelligence"
              value={`Score: ${data.social?.score || 0}/100`}
              detail={`${data.social?.linksCount || 0} platforms detected. Status: ${data.social?.status || 'Active'}`}
              confidence="Heuristic"
              color="var(--accent-primary)"
              showRaw={showRaw}
              rawData={data.social}
              onAdjust={(val) => handleAdjust('social', val)}
            />

            <DashboardBox
              title="5. Combined Audience"
              value={`${Math.round(((data.social?.score || 0) * 0.4 + (data.traffic?.score || 0) * 0.6) * adjustments.traffic * adjustments.social)}/100`}
              detail="Weighted Traffic (0.6) + Social (0.4)"
              confidence="Calc + Manual"
              color="var(--success)"
            />

            <DashboardBox
              title="6. Technical Eligibility"
              value={data.eligibility?.status || 'Review Needed'}
              detail={data.eligibility?.staticFit ? "Static / Content focus" : "Dynamic / SPA complexity"}
              confidence="Hard Gate"
              color={data.eligibility?.staticFit ? "var(--success)" : "var(--danger)"}
              showRaw={showRaw}
              rawData={data.eligibility}
            />

            <DashboardBox
              title="7. Business & Funding"
              value={data.business?.founderFound ? "Founder Detected" : "Team Scan Active"}
              detail={`Estimated Size: ${data.business?.teamSize || '1-5'}. Funding Signal: ${data.business?.funding ? 'Yes' : 'No'}`}
              confidence="Heuristic"
              color="var(--accent-secondary)"
              showRaw={showRaw}
              rawData={data.business}
            />

            <DashboardBox
              title="8. Revenue Band"
              value={data.revenue?.band || '< $100k'}
              detail="Estimated based on traffic and platform complexity"
              confidence="Derived"
              color="var(--warning)"
              showRaw={showRaw}
              rawData={data.revenue}
            />

            <DashboardBox
              title="9. Final Export Fit"
              value={calculateFinalScore() > 70 ? 'Excellent' : 'Manual Review'}
              detail={data.decision?.action || 'Manual review recommended'}
              confidence={`Total Score: ${calculateFinalScore()}/100`}
              color={calculateFinalScore() > 70 ? "var(--success)" : "var(--warning)"}
            >
              <div className="manual-adjust" style={{ marginTop: '1rem', borderTop: 'none' }}>
                <p style={{ fontSize: '0.9rem', color: 'white', fontWeight: '600' }}>{data.decision?.pitch || 'Export fit scan complete.'}</p>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Brand Quality: </label>
                  <input
                    type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0"
                    onChange={(e) => handleAdjust('brand', parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-secondary)', height: '10px' }}
                  />
                </div>
              </div>
            </DashboardBox>
          </>
        ) : data?.error ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--danger)', padding: '4rem' }}>
            Error: {data.error}
          </div>
        ) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>
            Enter a URL and start the scan to see all 9 intelligence boxes
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
