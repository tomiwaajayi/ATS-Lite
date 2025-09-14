# ATS-Lite - Watch the ATS Think 🤖

A mini coding exercise that shows off front-end polish, back-end logic, and a
transparent agent loop.

## 🎯 Challenge Overview

This Next.js application implements an Applicant Tracking System (ATS) that
allows users to query a candidate database using natural language. The system
follows the MCP (Model-Context-Protocol) workflow pattern: **Think → Act → Act →
Speak**.

## 🚀 Features

### Core Functionality

- **Natural Language Queries**: Ask questions like "Backend engineers in Berlin,
  most experience first"
- **Real-time Processing**: Watch the AI think and process your request step by
  step
- **Transparent Timeline**: See every phase of the MCP workflow in the sidebar
- **Interactive Results**: Click on candidates to view detailed information

### Technical Implementation

- **Smart Filtering**: Supports regex patterns and flexible string matching
- **Intelligent Ranking**: Sorts candidates by experience, skills, or custom
  criteria
- **Rich Statistics**: Aggregates candidate data including top skills and
  experience averages
- **Smooth Animations**: Framer Motion animations throughout the UI

### UI/UX Features

- **Staggered Animations**: Timeline events and table rows animate in sequence
- **Loading States**: Progress indicators and skeleton screens
- **Keyboard Shortcuts**: ⌘+Enter to send queries
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode Ready**: Built with Tailwind CSS and shadcn/ui components

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: Zustand
- **CSV Processing**: PapaParse
- **Progress Indicators**: NProgress
- **LLM Integration**: OpenAI GPT-3.5-turbo (with mock fallback)

## 📋 MCP Workflow Implementation

### 1. THINK Phase 🧠

- LLM processes the user query
- Extracts filtering and ranking criteria
- Generates structured plans

### 2. ACT Phase 1 🔍

- Applies filters to the candidate database
- Supports exact matches, contains, and regex patterns
- Updates filtered results in real-time

### 3. ACT Phase 2 📊

- Ranks filtered candidates by specified criteria
- Primary sorting with tie-breakers
- Animated result updates

### 4. SPEAK Phase ✨

- Generates human-friendly summaries
- Shows top candidates and statistics
- Provides actionable insights

## 🎨 UI Components

### Timeline Sidebar

- **Query Sessions**: Each query gets its own collapsible card with timestamp
- **Auto-Expand**: Active queries automatically expand to show live progress
- **Smart Grouping**: Previous queries collapse when new ones start
- **Status Indicators**: Visual feedback for success, errors, and active states
- **Color-coded Events**: Blue for filter, yellow for rank, green for results
- **Detailed Timeline**: Full MCP workflow visibility within each query

### Result Table

- Animated candidate rows with experience badges
- Skills tags with overflow indicators
- Click-to-view detailed candidate profiles

### Chat Interface

- Multi-line input with keyboard shortcuts
- Loading states with spinner animations
- Helpful query suggestions

### Candidate Details Modal

- Comprehensive candidate information
- Animated skill tags
- Raw JSON view for debugging

## 📊 Example Queries

Try these queries to see the system in action:

- `"Backend engineers in Berlin"`
- `"Frontend developers, most experience first"`
- `"Engineers willing to relocate"`
- `"Most experienced developers"`
- `"Berlin backend engineers"`

## 🔧 Tools Implementation

### applyCandidateFilters(candidates, filterPlan)

- Supports include/exclude patterns with comprehensive field coverage
- Regex pattern matching with `/pattern/flags` syntax
- Case-insensitive string contains matching
- Returns FilterResult with metadata (count, totalProcessed)
- Built-in performance tracking and validation

### rankCandidates(ids, plan)

- Primary sorting field with optional tie-breakers
- Descending order by default (higher values first)
- Stable sorting for consistent results

### aggregateStats(ids)

- Candidate count and average experience
- Top 3 most common skills
- Rich statistics for better insights

## 🚀 Getting Started

1. **Install dependencies**:

   ```bash
   pnpm install
   pnpm add openai  # For real LLM integration
   ```

2. **Configure OpenAI**: Create a `.env.local` file in the root directory:

   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   **Important for Next.js**: The API key is used server-side only (in API
   routes), so it doesn't need the `NEXT_PUBLIC_` prefix. The app automatically
   falls back to a mock LLM implementation if the API key is not provided or if
   there are API errors.

3. **Start development server**:

   ```bash
   pnpm dev
   ```

4. **Open your browser**: Navigate to `http://localhost:3000`

5. **Try a query**: Type something like "Backend engineers in Berlin" and press
   ⌘+Enter

## 🧪 Testing

Run the test suite to verify functionality:

```bash
pnpm test
```

The test suite includes:

- **Requirement Test**: Verifies "React dev, Cyprus, sort by experience desc"
  with proper ranking logic
- **Tool Validation**: Tests filtering and ranking functions work correctly
- **LLM Integration**: Tests natural language query processing and plan
  generation
- **Edge Cases**: Handles various query patterns and data scenarios
- **Integration Tests**: Full workflow testing with real candidate data

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # Server-side API routes
│   │   ├── think/      # THINK phase endpoint
│   │   └── speak/      # SPEAK phase endpoint
│   ├── layout.tsx      # Root layout with metadata
│   └── page.tsx        # Main application page
├── components/         # React components
│   ├── ui/            # shadcn/ui base components
│   ├── ChatPanel.tsx  # Query input interface
│   ├── TimelineSideBar.tsx  # MCP workflow timeline
│   ├── ResultTable.tsx     # Candidate results table
│   └── CandidateDetails.tsx # Detailed candidate modal
├── lib/               # Utility libraries
│   ├── candidates.ts  # CSV loading utilities
│   ├── tools.ts       # Core ATS tools implementation
│   ├── llm.ts         # Client-side API integration
│   └── utils.ts       # General utilities
└── store/
    └── index.ts       # Zustand state management
```

### API Architecture

The application uses Next.js API routes to handle OpenAI integration securely:

- **`/api/think`**: Processes natural language queries and returns structured
  filter/ranking plans
- **`/api/speak`**: Generates human-friendly summaries from candidate results

This architecture ensures the OpenAI API key stays server-side and provides
automatic fallback to mock responses.

## 🎯 Challenge Requirements Met

✅ **CSV Loading**: Pre-loads 50 candidate records  
✅ **Natural Language Chat**: Intuitive query interface  
✅ **MCP Workflow**: Think → Act → Act → Speak pattern  
✅ **Tool Implementation**: All three required tools with enhanced features  
✅ **UI Animations**: Smooth, staggered animations throughout  
✅ **Timeline Visualization**: Collapsible panel showing each step  
✅ **Result Table**: Always shows current ranked subset with animations  
✅ **Loading States**: Progress bars and skeleton screens  
✅ **Row Details**: Click to view full candidate information  
✅ **Agent Transparency**: Every MCP phase surfaced in order  
✅ **Prompt Robustness**: Handles various query formats gracefully  
✅ **Code Quality**: Modular, typed, and well-structured

## 🏆 Bonus Features

- **Keyboard Shortcuts**: ⌘+Enter for quick queries
- **Clear Results**: Reset functionality to start fresh
- **Enhanced Statistics**: Top skills aggregation
- **Regex Support**: Advanced filtering patterns
- **Responsive Design**: Mobile-friendly interface
- **Loading Animations**: Smooth state transitions
- **Error Handling**: Graceful error recovery

---

_Built with ❤️ for the ATS Challenge_
