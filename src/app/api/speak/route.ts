import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  let originalQuery = '';
  let topCandidates: any[] = [];
  let stats: any = {};

  try {
    const requestData = await request.json();
    originalQuery = requestData.originalQuery;
    topCandidates = requestData.topCandidates;
    stats = requestData.stats;

    if (!process.env.OPENAI_API_KEY) {
      // Return mock response if no API key
      return NextResponse.json({
        summary: getMockSpeakResponse(originalQuery, topCandidates, stats),
      });
    }

    if (stats.count === 0) {
      const prompt = `A recruiter searched for: "${originalQuery}"
      
No candidates were found. Generate a helpful, professional response suggesting alternative search terms or broader criteria.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are ATS-Lite, a helpful ATS assistant. Provide concise, professional responses to recruiters.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
      });

      return NextResponse.json({
        summary:
          completion.choices[0]?.message?.content?.trim() ||
          'No candidates match your criteria. Try adjusting your search.',
      });
    }

    const top5 = topCandidates.slice(0, 5);
    const candidateDetails = top5
      .map((c: any) => `${c.full_name} - ${c.title} (${c.years_experience} yrs, ${c.location})`)
      .join('\n');

    const prompt = `A recruiter searched for: "${originalQuery}"

Found ${stats.count} candidates (avg ${stats.avg_experience} yrs experience).

Top 5 candidates:
${candidateDetails}

Statistics:
- Total matches: ${stats.count}
- Average experience: ${stats.avg_experience} years
- Top skills: ${stats.top_skills.map((s: any) => `${s.skill} (${s.count})`).join(', ')}

Generate a concise, professional summary for the recruiter highlighting the key findings and top candidates.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are ATS-Lite, a helpful ATS assistant. Provide concise, professional summaries for recruiters.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
    });

    return NextResponse.json({
      summary: completion.choices[0]?.message?.content?.trim() || 'Summary generated successfully.',
    });
  } catch (error) {
    console.error('OpenAI API error in SPEAK phase:', error);
    // Fall back to mock implementation
    return NextResponse.json({
      summary: getMockSpeakResponse(originalQuery, topCandidates, stats),
    });
  }
}

function getMockSpeakResponse(
  originalQuery: string,
  topCandidates: any[],
  stats: { count: number; avg_experience: string; top_skills: any[] }
): string {
  if (stats.count === 0) {
    return 'No candidates match your criteria. Try adjusting your search terms or expanding your requirements.';
  }

  const top5 = topCandidates.slice(0, 5);
  const topNames = top5.map(c => c.full_name).slice(0, 3);

  let summary = `I found ${stats.count} matches (avg ${stats.avg_experience} yrs experience).`;

  if (topNames.length > 0) {
    summary += ` Here are the top ${Math.min(3, topNames.length)}: ${topNames.join(', ')}.`;
  }

  if (stats.top_skills.length > 0) {
    const topSkill = stats.top_skills[0];
    summary += ` Most common skill: ${topSkill.skill} (${topSkill.count} candidates).`;
  }

  // Add contextual insights based on the query
  const query = originalQuery.toLowerCase();
  if (query.includes('cyprus') && stats.count > 0) {
    const cyprusCount = topCandidates.filter(c => c.location === 'Cyprus').length;
    if (cyprusCount > 0) {
      summary += ` ${cyprusCount} are based in Cyprus.`;
    }
  }

  if (query.includes('react') && stats.count > 0) {
    const reactCount = topCandidates.filter(c => c.title.includes('React')).length;
    if (reactCount > 0) {
      summary += ` ${reactCount} are React specialists.`;
    }
  }

  return summary;
}
