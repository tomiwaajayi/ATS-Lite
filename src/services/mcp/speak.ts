import OpenAI from 'openai';
import { StreamWriter, sendPhaseUpdate } from '@/services/streaming';
import { aggregateStats } from '@/services/tools';
import { Candidate } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function performSpeakPhase(
  writer: StreamWriter,
  userQuery: string,
  rankedCandidates: Candidate[]
): Promise<void> {
  const stats = aggregateStats(rankedCandidates.map(c => c.id));

  const systemPrompt = `You are ATS-Lite, a helpful recruitment assistant. 
Generate a well-formatted, professional summary of candidate search results.

CRITICAL: Format your response as clean, readable markdown that will display properly in a chat interface.

Required structure:
## 🎯 Found {count} candidates matching your criteria

**📊 Quick Stats:**
- Average experience: {avg} years
- Top skills: {skill1}, {skill2}, {skill3}
- Locations: {locations}

**👥 Top Candidates:**

1. **{Name}** ({Title})  
   📍 {Location} • ⏱️ {Years} years • 💰 {Salary}

2. **{Name}** ({Title})  
   📍 {Location} • ⏱️ {Years} years • 💰 {Salary}

[Continue for top 5 candidates]

**💡 Key Insights:**
[Brief analysis of the candidate pool]

Keep it professional, concise, and visually appealing with proper markdown formatting.`;

  const candidatesSummary = rankedCandidates.slice(0, 5).map((c, i) => ({
    rank: i + 1,
    name: c.full_name,
    title: c.title,
    location: c.location,
    years: c.years_experience,
    salary: c.desired_salary_usd,
    skills: c.skills,
  }));

  const uniqueLocations = [...new Set(rankedCandidates.map(c => c.location).filter(Boolean))];

  const contextMessage = `USER QUERY: "${userQuery}"

SEARCH RESULTS:
- Total candidates found: ${stats.count}
- Average experience: ${stats.avg_experience} years
- Top skills: ${stats.top_skills
    .slice(0, 5)
    .map(s => `${s.skill} (${s.count})`)
    .join(', ')}
- Locations: ${uniqueLocations.slice(0, 5).join(', ')}

TOP 5 CANDIDATES:
${candidatesSummary
  .map(c => `${c.rank}. ${c.name} (${c.title}) - ${c.location} - ${c.years} years - ${c.salary}`)
  .join('\n')}

Please generate a professional summary following the required markdown structure.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextMessage },
    ],
    max_tokens: 500,
    stream: true,
  });

  // Stream the response
  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      await sendPhaseUpdate(writer, {
        type: 'content',
        content: content,
        timestamp: new Date(),
      });
    }
  }
}
