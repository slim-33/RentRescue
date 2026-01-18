export interface AnalysisResult {
  summary: string;
  keyDetails: KeyDetail[];
  flaggedClauses: FlaggedClause[];
  overallRiskScore: number;
  recommendations: string[];
}

export interface KeyDetail {
  label: string;
  value: string;
  category: string;
}

export interface FlaggedClause {
  clause: ClausePattern;
  matchedText: string;
  position: number;
}

export interface ClausePattern {
  id: string;
  category: 'security_deposit' | 'rent' | 'termination' | 'maintenance' | 'privacy' | 'pets' | 'subletting' | 'utilities' | 'other';
  name: string;
  description: string;
  keywords: string[];
  isMalicious: boolean;
  severity: 'low' | 'medium' | 'high';
  legalReference?: string;
  explanation: string;
}

interface GeminiResponse {
  summary: string;
  keyDetails: Array<{
    label: string;
    value: string;
    category: string;
  }>;
  flaggedClauses: Array<{
    clause: {
      id: string;
      category: string;
      name: string;
      description: string;
      isMalicious: boolean;
      severity: 'low' | 'medium' | 'high';
      legalReference?: string;
      explanation: string;
    };
    matchedText: string;
    position: number;
  }>;
  overallRiskScore: number;
  recommendations: string[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function callGeminiAPI(contractText: string): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
  }

  const prompt = `Analyze this British Columbia residential tenancy agreement and return a JSON response with the following structure:

{
  "summary": "A brief summary of the contract (2-3 sentences)",
  "keyDetails": [
    {"label": "Monthly Rent", "value": "extracted value or 'N/A'", "category": "rent"},
    {"label": "Security Deposit", "value": "extracted value or 'N/A'", "category": "security_deposit"},
    {"label": "Lease Start Date", "value": "extracted value or 'N/A'", "category": "termination"},
    {"label": "Lease End Date", "value": "extracted value or 'N/A'", "category": "termination"},
    {"label": "Property Address", "value": "extracted value or 'N/A'", "category": "other"},
    {"label": "Landlord Name", "value": "extracted value or 'N/A'", "category": "other"},
    {"label": "Notice Period", "value": "extracted value or 'N/A'", "category": "termination"}
  ],
  "flaggedClauses": [
    {
      "clause": {
        "id": "unique-id",
        "category": "security_deposit|rent|termination|maintenance|privacy|pets|subletting|utilities|other",
        "name": "Clause name",
        "description": "Brief description",
        "isMalicious": true/false,
        "severity": "low|medium|high",
        "legalReference": "BC RTA Section reference if applicable",
        "explanation": "Why this clause is problematic or noteworthy"
      },
      "matchedText": "Exact text excerpt from the contract (max 300 chars)",
      "position": 0
    }
  ],
  "overallRiskScore": 0-100,
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"]
}

Focus on identifying:
1. Clauses that violate BC Residential Tenancy Act (illegal deposits, prohibited terms, etc.)
2. Potentially problematic clauses that may be unenforceable
3. Important details like rent, deposits, dates, notice periods
4. Provide specific BC tenancy law references where applicable

Contract text:
${contractText}

Return ONLY valid JSON, no other text.`;

  // Try different model endpoints
  const endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(`Gemini API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
        continue; // Try next endpoint
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        lastError = new Error('Invalid response format from Gemini API');
        continue;
      }

      const responseText = data.candidates[0].content.parts[0].text.trim();
      
      // Extract JSON from response (handle cases where Gemini adds markdown formatting)
      let jsonText = responseText;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const result: GeminiResponse = JSON.parse(jsonText);
      return result;
    } catch (error) {
      if (error instanceof SyntaxError) {
        lastError = error;
        continue; // Try next endpoint
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      continue; // Try next endpoint
    }
  }

  // If we get here, all endpoints failed
  throw lastError || new Error('All Gemini API endpoints failed');
}

export async function analyzeContract(text: string): Promise<AnalysisResult> {
  // Truncate text if too long (Gemini has token limits)
  const maxLength = 50000; // Rough estimate for token limits
  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) + '\n\n[... contract truncated due to length ...]'
    : text;

  const geminiResponse = await callGeminiAPI(truncatedText);

  // Convert Gemini response to our AnalysisResult format
  const flaggedClauses: FlaggedClause[] = geminiResponse.flaggedClauses.map((fc, index) => ({
    clause: {
      ...fc.clause,
      keywords: [], // Gemini doesn't provide keywords, but we keep the interface
      category: fc.clause.category as ClausePattern['category']
    },
    matchedText: fc.matchedText,
    position: fc.position
  }));

  return {
    summary: geminiResponse.summary,
    keyDetails: geminiResponse.keyDetails,
    flaggedClauses,
    overallRiskScore: geminiResponse.overallRiskScore,
    recommendations: geminiResponse.recommendations.slice(0, 5)
  };
}
