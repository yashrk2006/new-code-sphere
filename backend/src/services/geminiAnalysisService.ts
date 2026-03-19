import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ─── Rate limiter: max 3 calls per 60 seconds ────────────────────────────────
const callTimestamps: number[] = [];
const MAX_CALLS_PER_MINUTE = 3;
const WINDOW_MS = 60_000;

function canCallGemini(): boolean {
    const now = Date.now();
    // Remove timestamps older than 60s
    while (callTimestamps.length > 0 && now - callTimestamps[0] > WINDOW_MS) {
        callTimestamps.shift();
    }
    return callTimestamps.length < MAX_CALLS_PER_MINUTE;
}

function recordCall(): void {
    callTimestamps.push(Date.now());
}

export interface GeminiAnalysisResult {
    credibility_score: number;         // 0-100
    summary: string;                   // 2-3 sentence analysis
    recommended_action: string;        // Specific action for admin
    image_verdict: string;             // What was actually seen in the image
    location_context: string;          // Context about the reported location
    status: 'DONE' | 'SKIPPED' | 'FAILED';
}

// ─── Reverse geocode using Nominatim (free, no API key) ─────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        const resp = await fetch(url, { headers: { 'User-Agent': 'UrbanPulseAI/1.0' } });
        if (!resp.ok) return `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        const json = await resp.json() as { display_name?: string };
        return json.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// ─── Main analysis function ──────────────────────────────────────────────────
export async function analyzeIncident(params: {
    category: string;
    description: string;
    image_url: string;   // base64 data URI or empty string
    location: { lat: number; lng: number };
}): Promise<GeminiAnalysisResult> {
    // Skip if rate limit reached
    if (!canCallGemini()) {
        console.log('[Gemini] Rate limit reached — skipping analysis');
        return {
            credibility_score: 50,
            summary: 'AI analysis queued — rate limit reached. Report flagged for manual review.',
            recommended_action: 'Manually verify this report and dispatch if warranted.',
            image_verdict: 'Not analyzed (rate limited)',
            location_context: `GPS: ${params.location.lat.toFixed(4)}, ${params.location.lng.toFixed(4)}`,
            status: 'SKIPPED',
        };
    }

    // Reverse geocode the location
    const locationStr = await reverseGeocode(params.location.lat, params.location.lng);

    // Build the prompt
    const prompt = `You are an AI system for Urban Pulse, a civic intelligence platform. A citizen has submitted an incident report. Analyze it and respond with ONLY valid JSON (no markdown).

REPORT DETAILS:
- Category: ${params.category}
- Description: "${params.description || 'No description provided'}"
- Location: ${locationStr}
- Coordinates: ${params.location.lat.toFixed(5)}, ${params.location.lng.toFixed(5)}
${params.image_url ? '- Image: Attached (analyze it carefully)' : '- Image: Not provided'}

Respond with this exact JSON (no extra text):
{
  "credibility_score": <0-100, based on image match + location + description coherence>,
  "summary": "<2-3 sentences: what you observed, whether it matches the category, and severity>",
  "recommended_action": "<specific action for admin: e.g. 'Dispatch police unit immediately', 'Send sanitation team within 2 hours', 'Monitor — low severity'>",
  "image_verdict": "<what is actually visible in the image, or 'No image provided'>",
  "location_context": "<brief note about the reported area based on the address>"
}

Be concise, accurate, and actionable. Do not hallucinate details not present in the image.`;

    try {
        recordCall();
        
        const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const parts: Array<string | Part> = [];

        // Add image if available (base64)
        if (params.image_url && params.image_url.startsWith('data:')) {
            const [meta, b64] = params.image_url.split(',');
            const mimeType = meta.split(':')[1].split(';')[0] as 'image/jpeg' | 'image/png' | 'image/webp';
            parts.push({ inlineData: { data: b64, mimeType } });
        }
        
        parts.push(prompt);

        const result = await model.generateContent(parts);
        const text = result.response.text().trim();
        
        // Strip markdown code fences if present
        const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        const parsed = JSON.parse(clean);

        return {
            credibility_score: Math.min(100, Math.max(0, Number(parsed.credibility_score) || 50)),
            summary: String(parsed.summary || ''),
            recommended_action: String(parsed.recommended_action || ''),
            image_verdict: String(parsed.image_verdict || ''),
            location_context: String(parsed.location_context || ''),
            status: 'DONE',
        };
    } catch (err) {
        console.error('[Gemini] Analysis error:', err);
        return {
            credibility_score: 50,
            summary: 'AI analysis failed. Requires manual review.',
            recommended_action: 'Manually verify this report.',
            image_verdict: 'Analysis failed',
            location_context: locationStr,
            status: 'FAILED',
        };
    }
}
