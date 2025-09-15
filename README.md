# ATS-Lite - Watch the ATS Think 🤖

_A mini coding exercise that shows off front-end polish, back-end logic, and a
transparent agent loop._

## 🎯 Challenge Overview

This Next.js application implements an Applicant Tracking System (ATS) that
allows users to query a candidate database using natural language. The system
follows the **MCP (Model-Context-Protocol) workflow pattern**: **Think → Act →
Act → Speak**.

**🔗 Live Demo**: https://ats-lite-seven.vercel.app/

---

## 🛠️ Setup & Installation

### Prerequisites

- **OpenAI API Key**: Required for LLM functionality
  - Get your API key from
    [OpenAI Platform](https://platform.openai.com/api-keys)
  - The system uses GPT-4o-mini for query processing and response generation
  - The application requires a valid API key to function

### Quick Start

1. **Clone the repository:**

   ```bash
   git clone git@github.com:tomiwaajayi/ATS-Lite.git
   cd ats-lite
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure environment:**

   ```bash
   # Create .env.local file
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env.local
   ```

4. **Start development server:**

   ```bash
   pnpm dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Testing

```bash
# Run the Jest test suite
pnpm test

# Run with coverage
pnpm test -- --coverage
```

---

## 🚀 Features

### Core Functionality

- **Natural Language Queries**: Ask questions like "Backend engineers in Berlin,
  most experience first"
- **Real-time Processing**: Watch the AI think and process your request step by
  step
- **Transparent Timeline**: See every phase of the MCP workflow in the sidebar
- **Interactive Results**: Click on candidates to view detailed information
- **Streaming Responses**: Real-time token streaming for assistant responses

### Technical Implementation

- **Smart Filtering**: Supports regex patterns, contains matching, and flexible
  string filtering
- **Intelligent Ranking**: Sorts candidates by experience, skills, salary, or
  custom criteria with tie-breakers
- **Rich Statistics**: Aggregates candidate data including top skills,
  experience averages, and location breakdowns
- **Specification-Compliant Tools**: Exact tool signatures as required by the
  challenge specification

### UI/UX Features

- **Staggered Animations**: Timeline events and table rows animate in sequence
  using Framer Motion
- **Loading States**: Progress indicators and skeleton screens with NProgress
- **Keyboard Shortcuts**: ⌘+Enter to send queries
- **Responsive Design**: Works perfectly on desktop and mobile
- **Dark Mode Support**: Complete theme switching with next-themes
- **Chat Interface**: Collapsible chat panel with message history
- **Field Filtering**: Toggle table columns for better data visualization

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Animations**: Framer Motion for all UI transitions
- **State Management**: Zustand for global state
- **CSV Processing**: PapaParse for candidate data loading
- **Progress Indicators**: NProgress for loading states
- **LLM Integration**: OpenAI GPT-4o-mini
- **Testing**: Jest with React Testing Library
- **Linting**: ESLint + Prettier for code quality

---

## 📋 MCP Workflow Implementation

The system implements the exact MCP workflow as specified in the challenge
requirements:

### 1. THINK Phase 🧠

- **Input**: Natural language query + CSV headers
- **Process**: LLM processes the user query and generates structured plans
- **Output**: JSON with `filter` and `rank` objects
- **Features**: Robust prompt engineering
- **Streaming**: Real-time plan generation visibility

### 2. ACT Phase 1 - Filter 🔍

- **Input**: Filter plan from THINK phase
- **Process**: Applies filters using `filterCandidates(plan)` tool
- **Features**:
  - Regex pattern matching (`/pattern/flags` syntax)
  - Case-insensitive contains matching
  - Include/exclude criteria support
  - Numeric range filtering (experience, salary)
  - Boolean and enum field filtering
- **Output**: Filtered candidate array with metadata

### 3. ACT Phase 2 - Rank 📊

- **Input**: Filtered candidate IDs + ranking plan
- **Process**: Ranks using `rankCandidates(ids, plan)` tool
- **Features**:
  - Primary sorting with configurable direction (asc/desc)
  - Multiple tie-breaker fields
  - Numeric, string, and boolean value comparison
  - Stable sorting algorithm
- **Output**: Ranked candidate array

### 4. SPEAK Phase ✨

- **Input**: Top candidates + original query + statistics
- **Process**: Generates human-friendly summaries using LLM
- **Features**:
  - Rich statistics integration using `aggregateStats(ids)`
  - Top skills and location insights
  - Professional recruiter-focused language
  - Contextual recommendations
- **Output**: Markdown-formatted summary

---

## 🔧 Required Tools Implementation

All three tools are implemented with **exact specification compliance**:

### `filterCandidates(plan)` → `Candidate[]`

```typescript
// Specification signature: { include?, exclude? } → Candidate[]
export function filterCandidates(plan: FilterPlan): Candidate[] {
  const result = applyCandidateFilters(candidatesGlobal, plan);
  return result.filtered;
}
```

**Features:**

- Supports all CSV fields for filtering
- Regex pattern matching with `/pattern/flags` syntax
- Include/exclude logic with precedence rules
- Numeric range filtering (`_min`, `_max` suffixes)
- Boolean field filtering
- Performance optimized with early exit conditions

### `rankCandidates(ids, plan)` → `Candidate[]`

```typescript
// Specification signature: { primary, tie_breakers? } → Candidate[]
export function rankCandidatesSpec(
  ids: number[],
  plan: RankingPlan
): Candidate[] {
  return rankCandidates(ids, plan, candidatesGlobal);
}
```

**Features:**

- Primary sorting field with direction control
- Multiple tie-breaker support
- Handles numeric, string, and boolean comparisons
- Stable sorting for consistent results
- Optimized comparison algorithms

### `aggregateStats(ids)` → `{ count, avg_experience, top_skills[] }`

```typescript
// Specification signature: ids[] → { count, avg_experience, top_skills[] }
export function aggregateStatsSpec(ids: number[]): StatsResult {
  const stats = aggregateStats(ids, candidatesGlobal);
  return {
    count: stats.count,
    avg_experience: stats.avg_experience,
    top_skills: stats.top_skills,
  };
}
```

**Features:**

- Candidate count and experience averaging
- Top 10 most common skills with frequency
- Location and language aggregation
- Education/work preference breakdowns
- Salary statistics (when available)

---

## 🎨 UI Components & Animations

### Timeline Sidebar

- **Query Sessions**: Each query gets its own collapsible card with timestamp
- **Auto-Expand**: Active queries automatically expand to show live progress
- **Smart Grouping**: Previous queries collapse when new ones start
- **Status Indicators**: Visual feedback for success, errors, and active states
- **Color-coded Events**: Distinct colors for each MCP phase
- **Detailed Progress**: Full workflow visibility with JSON plan viewers
- **Staggered Animations**: Sequential phase reveal with Framer Motion

### Result Table

- **Animated Rows**: FLIP animations when candidates reorder
- **Rich Data Display**: Badges, currency formatting, skill tags
- **Field Customization**: Toggle columns via FieldsFilter component
- **Performance Optimized**: Virtual scrolling for large datasets
- **Click Interactions**: Candidate detail modal on row click

### Chat Interface

- **Floating Panel**: Expandable chat bubble in bottom-right corner
- **Streaming Tokens**: Real-time response display with typing indicators
- **Markdown Support**: Rich text rendering with react-markdown
- **Query Suggestions**: Rotating example queries with animations
- **Network Handling**: Connection validation and error recovery
- **Keyboard Shortcuts**: ⌘+Enter for submit, escape to close

### Candidate Details Modal

- **Comprehensive Info**: All candidate fields with rich formatting
- **Skill Visualization**: Interactive skill tags with categories
- **Raw JSON View**: Developer-friendly data inspection
- **External Links**: Direct LinkedIn profile access
- **Animation**: Smooth modal transitions with backdrop blur

---

## 🧪 Testing

The application includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm type-check

# Linting and formatting
pnpm lint
pnpm format
```

### Test Suite Includes:

- **Challenge Requirement Test**: Verifies "React dev, Cyprus, sort by
  experience desc" with candidate #12 ranking above #5
- **Tool Validation**: Tests all filtering and ranking functions work correctly
- **LLM Integration**: Tests natural language query processing and plan
  generation
- **Edge Cases**: Handles various query patterns and data scenarios

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Server-side API routes
│   │   ├── chat/          # Main MCP workflow endpoint
│   │   ├── think/         # THINK phase (LLM planning)
│   │   ├── speak/         # SPEAK phase (LLM summary)
│   │   └── test/          # Health check endpoint
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main application page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── ChatPanel.tsx     # Chat interface with streaming
│   ├── TimelineSidebar.tsx # MCP workflow timeline
│   ├── ResultTable.tsx   # Candidate results display
│   ├── CandidateDetails.tsx # Detailed candidate modal
│   ├── FieldsFilter.tsx  # Column visibility controls
│   ├── SplashScreen.tsx  # Animated loading screen
│   └── ...               # Other UI components
├── services/             # Core services and utilities
│   ├── mcp/              # MCP workflow implementation
│   │   ├── workflow.ts   # Main orchestration
│   │   ├── think.ts      # THINK phase logic
│   │   ├── filter-act.ts # ACT 1 (filtering)
│   │   ├── rank-act.ts   # ACT 2 (ranking)
│   │   └── speak.ts      # SPEAK phase logic
│   ├── tools.ts          # Core ATS tools (specification-compliant)
│   ├── candidate-filtering.ts # Advanced filtering logic
│   ├── candidate-ranking.ts   # Ranking algorithms
│   ├── candidates.ts     # CSV loading utilities
│   ├── streaming.ts      # Response streaming utilities
│   └── utils.ts          # General utilities
├── store/                # Zustand state management
│   ├── candidates.ts     # Candidate data state
│   ├── chat.ts          # Chat and session state
│   ├── ui.ts            # UI component state
│   └── index.ts         # Store exports
├── types/               # TypeScript definitions
│   ├── candidate.ts     # Candidate data types
│   ├── filtering.ts     # Filter and ranking types
│   ├── api.ts           # API request/response types
│   └── ...              # Other type definitions
public/
├── candidates.csv       # 50 candidate records (as specified)
└── ...                  # Static assets
```

---

## 🎯 Challenge Requirements Compliance

### ✅ **Deliverables Met**

- **Git Repository**: Clean commits with descriptive messages
- **Clear README**: Comprehensive documentation (this file)
- **Quick Start**: `pnpm install && pnpm dev` works immediately
- **Environment Configuration**: OpenAI API key setup documented
- **Jest Test**: Specific test case "React dev, Cyprus, sort by experience desc"
- **GitHub + Deployment Links**: Available above

### ✅ **Technical Requirements**

- **Pre-loaded CSV**: 50 candidate records with all required fields
- **Natural Language Chat**: Multi-line input with suggestions and shortcuts
- **MCP Loop**: Complete Think → Act → Act → Speak workflow
- **Three Required Tools**: All implemented with exact specification signatures
- **Streaming**: All phases stream to UI with smooth animations

### ✅ **UI & Animation Requirements**

- **Chat Panel**: Token streaming with markdown support
- **Timeline Sidebar**: Collapsible panels revealing phases step-by-step
- **Result Table**: Animated row reordering with FLIP animations
- **Loading Cues**: NProgress bars and skeleton screens
- **Row Details**: Click-to-expand candidate information
- **Keyboard Shortcuts**: ⌘+Enter support

### ✅ **Evaluation Criteria**

- **Agent Transparency**: Every MCP phase visible in timeline
- **Prompt Robustness**: Handles various query formats
- **Animation & UX**: Staggered timeline, jank-free animations
- **Code Quality**: Modular helpers, clean state management, TypeScript
- **Documentation**: Comprehensive README with clear examples

---

## 🏆 Enhanced Features Beyond Requirements

- **Dark Mode Support**: Complete theme system with next-themes
- **Responsive Design**: Perfect mobile and desktop experiences
- **Advanced Filtering**: Regex patterns, numeric ranges, boolean logic
- **Rich Statistics**: Extended aggregation beyond basic requirements
- **Error Handling**: Graceful fallbacks and user feedback
- **Performance**: Optimized rendering and data processing
- **Accessibility**: Semantic HTML and keyboard navigation
- **Type Safety**: Full TypeScript coverage
- **Testing**: Comprehensive test suite
- **Code Quality**: ESLint, Prettier, and automated formatting

---

## 🔧 API Architecture

The application uses Next.js API routes for secure server-side processing:

### `/api/think` - THINK Phase

- **Input**: Natural language query + CSV headers
- **Process**: OpenAI GPT-4o-mini analysis with structured prompts
- **Output**: JSON filter and ranking plans

### `/api/speak` - SPEAK Phase

- **Input**: Top candidates + query + statistics
- **Process**: LLM summary generation with professional tone
- **Output**: Markdown-formatted recruiter summary
- **Features**: Contextual insights and recommendations

### `/api/match` - Main Workflow

- **Input**: User messages array
- **Process**: Complete MCP workflow orchestration
- **Output**: Server-sent events stream
- **Features**: Real-time progress updates and error handling

This architecture ensures:

- **Security**: API keys stay server-side
- **Performance**: Streaming reduces perceived latency
- **Scalability**: Stateless design supports concurrent users

---

## 📄 License

This project is created for the ATS Challenge coding exercise.

---

_Built with ❤️ for the ATS Challenge - Showcasing transparent AI reasoning with
polished UX_
