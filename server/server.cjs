const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Helper: Detect Platform
const detectPlatform = (html, headers, $) => {
    const htmlLower = html.toLowerCase();

    // Framer
    if (htmlLower.includes('__framer-site') ||
        htmlLower.includes('framer-site-id') ||
        htmlLower.includes('w-framer') ||
        $('meta[name="generator"]').attr('content')?.toLowerCase().includes('framer') ||
        $('meta[property="og:site_name"]').attr('content')?.toLowerCase().includes('framer')) return 'Framer';

    // Webflow
    if (htmlLower.includes('data-wf-site') ||
        htmlLower.includes('data-wf-page') ||
        htmlLower.includes('w-webflow') ||
        $('meta[name="generator"]').attr('content')?.toLowerCase().includes('webflow')) return 'Webflow';

    // Wix
    if (htmlLower.includes('wix-config') ||
        htmlLower.includes('wix-image') ||
        htmlLower.includes('wix-site-id') ||
        (htmlLower.includes('wix.com') && htmlLower.includes('static.wixstatic.com'))) return 'Wix';

    // WordPress
    if (htmlLower.includes('wp-content') ||
        htmlLower.includes('wp-includes') ||
        $('meta[name="generator"]').attr('content')?.toLowerCase().includes('wordpress')) return 'WordPress';

    // Squarespace
    if (htmlLower.includes('squarespace.com') ||
        htmlLower.includes('static1.squarespace.com')) return 'Squarespace';

    return 'Unknown';
};

// Module Logic
app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        let cleanUrl = url.trim().toLowerCase();
        // Remove trailing slash if it causes issues with some heuristics, but let's just ensure protocol
        if (!cleanUrl.startsWith('http')) {
            cleanUrl = `https://${cleanUrl}`;
        }

        const response = await axios.get(cleanUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 10000 // 10 second timeout
        });
        const html = response.data;
        const $ = cheerio.load(html);
        console.log(`Analyzing: ${cleanUrl} (HTML Length: ${html.length})`);

        // 1. Identity & Platform Detection
        const platform = detectPlatform(html, response.headers, $);
        const title = $('title').text();
        const description = $('meta[name="description"]').attr('content') || '';

        // 2. Platform Cost Estimation
        const pricingMap = {
            'Framer': { plan: 'Pro', cost: 30 },
            'Webflow': { plan: 'CMS', cost: 23 },
            'Wix': { plan: 'Business', cost: 27 },
            'WordPress': { plan: 'Managed', cost: 15 },
            'Unknown': { plan: 'Custom', cost: 10 }
        };
        const likelyPlan = pricingMap[platform] || pricingMap['Unknown'];

        // 3. Traffic Estimation (Heuristic)
        const scripts = $('script').length;
        const links = $('a').length;
        const images = $('img').length;
        const trafficTier = scripts > 50 || links > 100 ? 'High' : (scripts > 20 || links > 50 ? 'Medium' : 'Low');
        const trafficScore = trafficTier === 'High' ? 100 : (trafficTier === 'Medium' ? 50 : 20);
        const trafficRange = trafficTier === 'High' ? '100k - 500k' : (trafficTier === 'Medium' ? '10k - 50k' : '< 10k');

        // 4. Social Media Intelligence (Heuristic)
        const socialLinks = [];
        $('a[href*="instagram.com"], a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="tiktok.com"], a[href*="youtube.com"]').each((i, el) => {
            socialLinks.push($(el).attr('href'));
        });
        const socialQualityScore = Math.min(100, socialLinks.length * 25);

        // 6. Technical Eligibility (Hard Gate)
        const isSPA = html.includes('id="root"') || html.includes('id="app"') || html.includes('next/static');
        const hasAuth = html.toLowerCase().includes('login') || html.toLowerCase().includes('signup') || html.toLowerCase().includes('dashboard') || html.toLowerCase().includes('account');
        const hasCart = html.toLowerCase().includes('cart') || html.toLowerCase().includes('checkout') || html.toLowerCase().includes('basket');
        const staticFit = !hasAuth && !hasCart && !isSPA;

        // 7. Business People & Funding Signals
        const teamText = $('body').text().toLowerCase();
        const foundersDetected = teamText.includes('founder') || teamText.includes('ceo') || teamText.includes('co-founder');
        const fundingSignals = teamText.includes('funding') || teamText.includes('raised') || teamText.includes('series a') || teamText.includes('series b');
        const teamSizeEstimate = links > 100 ? '20-50' : (links > 50 ? '5-20' : '1-5');

        // 8. Revenue Band Estimation
        const revenueBandMap = {
            'High': '$1M - $10M',
            'Medium': '$100k - $500k',
            'Low': '< $100k'
        };
        const estimatedRevenueBand = revenueBandMap[trafficTier];

        // Final Decision Engine
        const baseScore = (staticFit ? 40 : 0) +
            (likelyPlan.cost > 20 ? 30 : 10) +
            (trafficTier === 'High' ? 20 : (trafficTier === 'Medium' ? 10 : 0)) +
            (foundersDetected ? 10 : 0);

        res.json({
            platform,
            identity: { title, description, socialLinks, address: 'Detected in footer' },
            costEstimation: { ...likelyPlan, confidence: 'Medium (Fingerprint Based)' },
            traffic: { score: trafficScore, tier: trafficTier, range: trafficRange, scripts, links, images, confidence: 'Heuristic' },
            social: { score: socialQualityScore, linksCount: socialLinks.length, status: socialLinks.length > 2 ? 'Active' : (socialLinks.length > 0 ? 'Medium' : 'Low Activity') },
            eligibility: { staticFit, status: staticFit ? 'Eligible' : 'Manual Review', hasAuth, hasCart, isSPA },
            business: { teamSize: teamSizeEstimate, founderFound: foundersDetected, funding: fundingSignals },
            revenue: { band: estimatedRevenueBand, confidence: 'Derived from Traffic' },
            decision: {
                score: baseScore,
                fit: baseScore > 75 ? 'Excellent' : (baseScore > 50 ? 'Good' : 'Medium'),
                action: baseScore > 75 ? 'Contact Immediately' : (baseScore > 40 ? 'Review Socials' : 'Ignore'),
                pitch: `Save $${(likelyPlan.cost * 0.9).toFixed(0)}/mo by exporting your ${platform} site to clean code.`
            },
            rawData: { htmlSnippet: html.substring(0, 1000), scriptsDetected: scripts, meta: { title, description } }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to analyze website. Ensure the URL is public.' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
