import OpenAI from 'openai';
import { MCPPlans } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Query validation patterns
const QUERY_VALIDATION = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 500,
  SUSPICIOUS_PATTERNS: [
    /^[^a-zA-Z]*$/, // Only special characters
    /(.)\1{10,}/, // Repeated characters
  ],
};

// Process user queries and generate filtering/ranking plans
export async function performThinkPhase(
  userQuery: string,
  csvHeaders: string[]
): Promise<MCPPlans> {
  // Basic input checks
  if (!userQuery?.trim()) {
    throw new Error('User query is required and cannot be empty');
  }

  if (!csvHeaders?.length) {
    throw new Error('CSV headers are required for query processing');
  }

  // Validate query content
  const sanitizedQuery = userQuery.trim();
  if (sanitizedQuery.length < QUERY_VALIDATION.MIN_LENGTH) {
    throw new Error(`Query too short. Minimum ${QUERY_VALIDATION.MIN_LENGTH} characters required`);
  }

  if (sanitizedQuery.length > QUERY_VALIDATION.MAX_LENGTH) {
    throw new Error(`Query too long. Maximum ${QUERY_VALIDATION.MAX_LENGTH} characters allowed`);
  }

  // Filter out junk queries
  for (const pattern of QUERY_VALIDATION.SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitizedQuery)) {
      throw new Error('Invalid query format detected');
    }
  }

  return await performThinkPhaseWithRetry(sanitizedQuery, csvHeaders, 2);
}

async function performThinkPhaseWithRetry(
  userQuery: string,
  csvHeaders: string[],
  maxRetries: number
): Promise<MCPPlans> {
  // Build the main system prompt for the LLM
  const systemPrompt = `You are an ATS assistant specialized in candidate filtering and ranking.

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, no extra text.

MANDATORY: The "rank" object MUST ALWAYS contain a "primary" object with "field" and "direction" properties. NEVER return an empty rank object.

Required JSON Structure:
{
  "filter": {
    "include": { "field": "value" },
    "exclude": { "field": "value" }
  },
  "rank": {
    "primary": { "field": "field_name", "direction": "desc" },
    "tie_breakers": [{ "field": "field_name", "direction": "desc" }]
  }
}

Available CSV Fields: ${csvHeaders.join(', ')}

FILTER FIELD SPECIFICATIONS:
- title: Use regex patterns like "/Backend/i" or arrays like ["/Frontend/", "/UI/"]
- location: Exact matches ("USA", "Germany", "Berlin, Germany", "San Francisco, USA")
- skills: Comma-separated skill names ("React", "Python", "JavaScript", "Node.js")
- years_experience_min/max: Numeric ranges (e.g., years_experience_min: 3)
- desired_salary_min/max: Salary ranges in USD (e.g., desired_salary_min: 80000)
- work_preference: Exact values ("Remote", "Hybrid", "Onsite", "Any")
- willing_to_relocate/open_to_contract: Boolean values (true/false)

TITLE NORMALIZATION FOR DEVELOPER/ENGINEER VARIATIONS:
- When user says "frontend developers" OR "frontend engineers" → use "/(Frontend|Front.end).*(Developer|Engineer)/i"
- When user says "backend developers" OR "backend engineers" → use "/(Backend|Back.end).*(Developer|Engineer)/i"
- When user says "fullstack developers" OR "fullstack engineers" → use "/(Full.?Stack|Fullstack).*(Developer|Engineer)/i"
- When user says "software developers" OR "software engineers" → use "/(Software).*(Developer|Engineer)/i"
- When user says "mobile developers" OR "mobile engineers" → use "/(Mobile|iOS|Android).*(Developer|Engineer)/i"
- When user says "web developers" OR "web engineers" → use "/(Web).*(Developer|Engineer)/i"
- When user says "data engineers" OR "data developers" → use "/(Data).*(Engineer|Developer)/i"
- When user says "DevOps engineers" OR "DevOps developers" → use "/(DevOps|Dev.Ops).*(Engineer|Developer)/i"

PATTERN MATCHING RULES:
- For job types: "frontend" → "/Frontend/i", "backend" → "/Backend/i", "fullstack" → "/Full.?Stack/i"
- For developer/engineer variations: "frontend developer" OR "frontend engineer" → "/(Frontend|Front.end).*(Developer|Engineer)/i"
- For developer/engineer variations: "backend developer" OR "backend engineer" → "/(Backend|Back.end).*(Developer|Engineer)/i"
- For developer/engineer variations: "fullstack developer" OR "fullstack engineer" → "/(Full.?Stack|Fullstack).*(Developer|Engineer)/i"
- For developer/engineer variations: "software developer" OR "software engineer" → "/(Software).*(Developer|Engineer)/i"
- For developer/engineer variations: "mobile developer" OR "mobile engineer" → "/(Mobile|iOS|Android).*(Developer|Engineer)/i"
- For cloud roles: "cloud specialist", "cloud experience", "cloud engineer", "cloud expert" → "/Cloud.*Architect/i"
- For seniority: "senior" → "/Senior/i", "junior" → "/Junior/i", "lead" → "/Lead/i"
- For location normalization: "US/USA/America" → "USA", "UK/Britain" → "United Kingdom"
- Case-insensitive matching with "/pattern/i" when appropriate

CLOUD SEARCH MAPPING RULES:
- "cloud specialist" → title: "/Cloud.*Architect/i" OR tags: "cloud" OR skills matching AWS/GCP/Azure
- "cloud experience" → title: "/Cloud.*Architect/i" OR tags: "cloud" OR skills matching AWS/GCP/Azure  
- "cloud engineer" → title: "/Cloud.*Architect/i" OR tags: "cloud"
- "AWS/GCP/Azure specialist" → skills: "AWS|GCP|Azure" AND (title: "/Cloud/i" OR tags: "cloud")
- For cloud-related queries, consider multiple matching strategies: title patterns, cloud tags, and cloud platform skills

RANKING FIELD OPTIONS:
- years_experience: "desc" for most experienced, "asc" for least experienced
- desired_salary_usd: "desc" for highest salary, "asc" for lowest salary  
- availability_weeks: "asc" for earliest availability, "desc" for latest availability

QUERY INTERPRETATION LOGIC:
1. Extract specific requirements over general ones
2. Default to "desc" sorting for experience/salary unless specified otherwise
3. For ambiguous queries, prioritize commonly requested filters
4. If query lacks clear criteria, use restrictive filter: {"title": ["__NO_MATCH__"]}
5. Always provide both filter and rank objects
6. MANDATORY: rank.primary object must ALWAYS be present with valid field and direction
7. If no specific ranking is requested, default to: {"field": "years_experience", "direction": "desc"}

EXAMPLES:
- "React developers in USA" → include: {"skills": "React", "location": "USA"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "Frontend developers" → include: {"title": "/(Frontend|Front.end).*(Developer|Engineer)/i"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "Backend engineers" → include: {"title": "/(Backend|Back.end).*(Developer|Engineer)/i"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "Fullstack developers" → include: {"title": "/(Full.?Stack|Fullstack).*(Developer|Engineer)/i"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "Software engineers" → include: {"title": "/(Software).*(Developer|Engineer)/i"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "Mobile developers" → include: {"title": "/(Mobile|iOS|Android).*(Developer|Engineer)/i"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "Senior backend engineers, most experienced" → include: {"title": "/Senior.*(Backend|Back.end).*(Developer|Engineer)/i"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "Remote workers under $100k" → include: {"work_preference": "Remote", "desired_salary_usd_max": 100000}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "cloud specialist" → include: {"title": "/Cloud.*Architect/i"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "cloud experience" → include: {"title": "/Cloud.*Architect/i"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "AWS expert" → include: {"skills": "AWS", "tags": "cloud"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "cloud architect with GCP" → include: {"title": "/Cloud.*Architect/i", "skills": "GCP"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "DevOps with cloud experience" → include: {"title": "/DevOps/i", "tags": "cloud"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}
- "candidates not in nigeria" → exclude: {"location": "Nigeria"}, rank: {"primary": {"field": "years_experience", "direction": "desc"}}`;

  // Log the request details
  const logData = {
    model: 'gpt-4o-mini',
    query: userQuery.slice(0, 100) + (userQuery.length > 100 ? '...' : ''),
    headers: csvHeaders.length,
    attempt: 3 - maxRetries,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('OpenAI API call:', logData);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Lower temperature for more consistent JSON output
      response_format: { type: 'json_object' },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('OpenAI response received:', {
        usage: response.usage,
        model: response.model,
        id: response.id,
      });
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      const errorDetails = {
        choices: response.choices?.length || 0,
        hasFirstChoice: !!response.choices?.[0],
        hasMessage: !!response.choices?.[0]?.message,
        finishReason: response.choices?.[0]?.finish_reason,
      };

      console.error('OpenAI response missing content:', errorDetails);
      throw new Error(`OpenAI returned empty response. Details: ${JSON.stringify(errorDetails)}`);
    }

    return await parseAndValidateResponse(content, userQuery);
  } catch (error) {
    if (error instanceof Error) {
      console.error('OpenAI API or parsing error:', {
        message: error.message,
        name: error.name,
        query: userQuery.slice(0, 50) + '...',
        retriesLeft: maxRetries,
      });

      // Check if it's a retryable error
      const retryableErrors = ['rate', 'timeout', 'network', 'parse', 'validation'];
      const isRetryable = retryableErrors.some(keyword =>
        error.message.toLowerCase().includes(keyword)
      );

      if (isRetryable && maxRetries > 0) {
        console.log(`Retrying due to ${error.name}... (${maxRetries} retries left)`);
        // Add a small delay before retry to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - maxRetries)));
        return await performThinkPhaseWithRetry(userQuery, csvHeaders, maxRetries - 1);
      }
    }

    // If we're here, either it's not retryable or we're out of retries
    console.log('Using intelligent fallback due to persistent errors');
    return createIntelligentFallback(userQuery);
  }
}

// Parse and validate the LLM response
async function parseAndValidateResponse(content: string, originalQuery: string): Promise<MCPPlans> {
  // Clean up the response content
  let cleanContent = content.trim();

  // Strip markdown formatting
  const cleaningPatterns: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /^```json\s*/, replacement: '' }, // Remove json code block start
    { pattern: /\s*```$/, replacement: '' }, // Remove code block end
    { pattern: /^```\s*/, replacement: '' }, // Remove generic code block start
    { pattern: /^Here's the JSON:?\s*/i, replacement: '' }, // Remove common prefixes
    { pattern: /^The JSON response is:?\s*/i, replacement: '' }, // Remove common prefixes
  ];

  for (const { pattern, replacement } of cleaningPatterns) {
    cleanContent = cleanContent.replace(pattern, replacement);
  }

  // Try to extract JSON object from text
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanContent = jsonMatch[0];
  } else {
    // Try to extract any JSON-like structure
    const alternativeMatch = cleanContent.match(/[\{\[][\s\S]*[\}\]]/);
    if (alternativeMatch) {
      cleanContent = alternativeMatch[0];
    }
  }

  try {
    const plans = JSON.parse(cleanContent) as MCPPlans;

    // Make sure the response format is correct
    const validationErrors = validateMCPPlans(plans);
    if (validationErrors.length > 0) {
      throw new Error(`Plan validation failed: ${validationErrors.join(', ')}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Successfully parsed and validated plans:', {
        hasFilter: !!plans.filter,
        hasRank: !!plans.rank,
        primaryRankField: plans.rank?.primary?.field,
        queryPreview: originalQuery.slice(0, 30) + '...',
      });
    }

    return plans;
  } catch (parseError) {
    const errorContext = {
      originalContent: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
      cleanedContent: cleanContent.slice(0, 200) + (cleanContent.length > 200 ? '...' : ''),
      parseErrorMessage: parseError instanceof Error ? parseError.message : 'Unknown parse error',
      queryContext: originalQuery.slice(0, 50) + '...',
    };

    console.error('JSON parsing failed:', errorContext);
    throw new Error(`Failed to parse response as valid JSON: ${errorContext.parseErrorMessage}`);
  }
}

// Check if the plans object has the right structure
function validateMCPPlans(plans: any): string[] {
  const errors: string[] = [];

  if (!plans || typeof plans !== 'object') {
    errors.push('Plans must be an object');
    return errors; // Can't validate further if not an object
  }

  // Validate filter structure
  if (!plans.filter) {
    errors.push('Missing filter object');
  } else if (typeof plans.filter !== 'object') {
    errors.push('Filter must be an object');
  }

  // Validate rank structure
  if (!plans.rank) {
    errors.push('Missing rank object');
  } else if (typeof plans.rank !== 'object') {
    errors.push('Rank must be an object');
  } else {
    // Validate primary ranking
    if (!plans.rank.primary) {
      errors.push('Missing rank.primary object');
    } else if (typeof plans.rank.primary !== 'object') {
      errors.push('rank.primary must be an object');
    } else {
      if (!plans.rank.primary.field || typeof plans.rank.primary.field !== 'string') {
        errors.push('rank.primary.field must be a non-empty string');
      }

      if (
        !plans.rank.primary.direction ||
        !['asc', 'desc'].includes(plans.rank.primary.direction)
      ) {
        errors.push('rank.primary.direction must be "asc" or "desc"');
      }
    }

    // Validate tie_breakers if present
    if (plans.rank.tie_breakers && !Array.isArray(plans.rank.tie_breakers)) {
      errors.push('rank.tie_breakers must be an array if provided');
    }
  }

  return errors;
}

// Fallback when LLM fails - try to guess what the user wants
function createIntelligentFallback(userQuery: string): MCPPlans {
  const queryLower = userQuery.toLowerCase();

  // Parse query keywords to make a decent guess
  let fallbackFilter: any = {};
  let fallbackRankField = 'years_experience';
  let fallbackDirection: 'asc' | 'desc' = 'desc';

  // Check for location exclusions
  if (
    queryLower.includes('not in') ||
    queryLower.includes('exclude') ||
    queryLower.includes('except')
  ) {
    // Handle location exclusions
    if (queryLower.includes('nigeria')) {
      fallbackFilter = { exclude: { location: 'Nigeria' } };
    } else if (queryLower.includes('usa') || queryLower.includes('america')) {
      fallbackFilter = { exclude: { location: 'USA' } };
    } else {
      // Default to restrictive filter if we can't parse the exclusion
      fallbackFilter = { include: { title: ['__NO_MATCH__'] } };
    }
  } else {
    // Default restrictive filter for unclear queries
    fallbackFilter = { include: { title: ['__NO_MATCH__'] } };
  }

  // Basic keyword matching for ranking
  if (
    queryLower.includes('experience') ||
    queryLower.includes('senior') ||
    queryLower.includes('lead')
  ) {
    fallbackRankField = 'years_experience';
    fallbackDirection = 'desc';
  } else if (queryLower.includes('salary') || queryLower.includes('pay')) {
    fallbackRankField = 'desired_salary_usd';
    fallbackDirection = 'desc';
  } else if (queryLower.includes('available') || queryLower.includes('start')) {
    fallbackRankField = 'availability_weeks';
    fallbackDirection = 'asc';
  }

  console.log('Creating intelligent fallback for query:', {
    query: userQuery.slice(0, 50) + '...',
    rankField: fallbackRankField,
    direction: fallbackDirection,
  });

  return {
    filter: fallbackFilter,
    rank: {
      primary: {
        field: fallbackRankField,
        direction: fallbackDirection,
      },
    },
  };
}
