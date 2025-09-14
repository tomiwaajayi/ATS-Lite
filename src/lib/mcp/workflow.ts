import { StreamWriter, sendPhaseUpdate } from '@/lib/streaming';
import { aggregateStats, setCandidatesGlobal } from '@/lib/tools';
import { Candidate } from '@/types/candidate';
import { performFilterPhase } from './filter-act';
import { performRankPhase } from './rank-act';
import { performSpeakPhase } from './speak';
import { performThinkPhase } from './think';

export async function runMCPWorkflow(
  writer: StreamWriter,
  userQuery: string,
  candidates: Candidate[]
): Promise<void> {
  // Input validation
  if (!userQuery?.trim()) {
    await sendPhaseUpdate(writer, {
      type: 'error',
      error: 'Empty query provided',
      timestamp: new Date(),
    });
    await writer.close();
    return;
  }

  if (!candidates?.length) {
    await sendPhaseUpdate(writer, {
      type: 'error',
      error: 'No candidate data available',
      timestamp: new Date(),
    });
    await writer.close();
    return;
  }

  try {
    // Set global candidates for specification-compliant tools
    setCandidatesGlobal(candidates);

    const csvHeaders = Object.keys(candidates[0]);

    // Production logging should be minimal - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Processing query: "${userQuery}" with ${candidates.length} candidates`);
    }

    // THINK Phase
    await sendPhaseUpdate(writer, {
      type: 'phase',
      phase: 'think',
      title: 'Analyzing Query',
      description: `Processing "${userQuery.slice(0, 50)}${userQuery.length > 50 ? '...' : ''}" against ${candidates.length} candidates`,
      timestamp: new Date(),
    });

    const plans = await performThinkPhase(userQuery, csvHeaders);

    // Validate plans
    if (!plans?.filter || !plans?.rank?.primary?.field) {
      throw new Error('Invalid plans generated - missing required filter or ranking criteria');
    }

    await sendPhaseUpdate(writer, {
      type: 'phase',
      phase: 'think',
      title: 'Plans Generated',
      description: 'Filter and ranking strategies created',
      data: {
        filterPlan: plans.filter,
        rankingPlan: plans.rank,
      },
      timestamp: new Date(),
    });

    // ACT-1 Phase - Filter
    await sendPhaseUpdate(writer, {
      type: 'phase',
      phase: 'filter',
      title: 'Filtering Candidates',
      description: 'Applying search criteria...',
      timestamp: new Date(),
    });

    // Small delay to show the filtering phase in timeline
    await new Promise(resolve => setTimeout(resolve, 400));

    const { filtered, count } = performFilterPhase(candidates, plans.filter);

    if (process.env.NODE_ENV === 'development') {
      console.log(`Filtered ${candidates.length} candidates down to ${count}`);
    }

    await sendPhaseUpdate(writer, {
      type: 'phase',
      phase: 'filter',
      title: 'Filtering Complete',
      description: `Found ${count} matching candidates (${Math.round((count / candidates.length) * 100)}% match rate)`,
      data: {
        count,
        filterPlan: plans.filter,
        total: candidates.length,
      },
      timestamp: new Date(),
    });

    // Small delay before proceeding to ranking phase
    await new Promise(resolve => setTimeout(resolve, 500));

    if (count === 0) {
      await sendPhaseUpdate(writer, {
        type: 'content',
        content:
          '## No candidates found\n\nNo candidates match your criteria. Try adjusting your search terms or expanding your requirements.',
        timestamp: new Date(),
      });

      await sendPhaseUpdate(writer, {
        type: 'complete',
        data: {
          totalCandidates: candidates.length,
          filteredCount: 0,
          finalResults: [],
        },
        timestamp: new Date(),
      });
      return;
    }

    // ACT-2 Phase - Rank
    await sendPhaseUpdate(writer, {
      type: 'phase',
      phase: 'rank',
      title: 'Ranking Candidates',
      description: `Sorting ${count} candidates by ${plans.rank.primary.field}...`,
      timestamp: new Date(),
    });

    // Small delay to show the ranking phase in timeline
    await new Promise(resolve => setTimeout(resolve, 400));

    const { ranked, rankedIds } = performRankPhase(filtered, plans.rank);

    if (process.env.NODE_ENV === 'development') {
      console.log(`Ranked ${ranked.length} candidates`);
    }

    // Generate quick stats for richer timeline display
    const stats = aggregateStats(rankedIds);

    await sendPhaseUpdate(writer, {
      type: 'phase',
      phase: 'rank',
      title: 'Ranking Complete',
      description: `Ranked ${ranked.length} candidates by ${plans.rank.primary.field} (${plans.rank.primary.direction})`,
      data: {
        count: ranked.length,
        rankedIds: rankedIds,
        rankingPlan: plans.rank,
        stats: {
          avgExperience: stats.avg_experience,
          topSkills: stats.top_skills.slice(0, 3).map(s => s.skill),
          locations: stats.locations.slice(0, 3),
        },
      },
      timestamp: new Date(),
    });

    // Small delay before proceeding to speak phase
    await new Promise(resolve => setTimeout(resolve, 500));

    // SPEAK Phase
    await sendPhaseUpdate(writer, {
      type: 'phase',
      phase: 'speak',
      title: 'Generating Summary',
      description: `Creating summary for top ${Math.min(5, ranked.length)} candidates...`,
      timestamp: new Date(),
    });

    await performSpeakPhase(writer, userQuery, ranked.slice(0, 10)); // Limit to top 10 for performance

    // Complete
    await sendPhaseUpdate(writer, {
      type: 'complete',
      data: {
        totalCandidates: candidates.length,
        filteredCount: count,
        finalResults: rankedIds,
      },
      timestamp: new Date(),
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`Workflow completed successfully for query: "${userQuery}"`);
    }
  } catch (error) {
    // Always log errors regardless of environment
    console.error('MCP Workflow error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    await sendPhaseUpdate(writer, {
      type: 'error',
      error: `Workflow failed: ${errorMessage}`,
      timestamp: new Date(),
    });
  } finally {
    await writer.close();
  }
}
