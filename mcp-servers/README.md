# MCP Servers Setup for Zenith-Fresh

This directory contains all the MCP (Model Context Protocol) servers to enhance your development experience.

## Installation

Run the installation script:
```bash
./install-all-mcps.sh
```

## API Keys Required

Before using certain MCPs, you'll need to set up the following environment variables:

### GitHub MCP
```bash
export GITHUB_TOKEN="your_github_personal_access_token"
```

### Figma MCP
```bash
export FIGMA_ACCESS_TOKEN="your_figma_access_token"
```

### MindsDB MCP
```bash
export MINDSDB_API_KEY="your_mindsdb_api_key"
```

### Pipedream MCP
```bash
export PIPEDREAM_API_KEY="your_pipedream_api_key"
```

### GPT Researcher MCP
```bash
export OPENAI_API_KEY="your_openai_api_key"
```

## MCP Categories

### 1. Development Tools
- **GitHub**: Version control integration
- **Playwright**: E2E testing automation
- **TypeScript SDK**: Enhanced TypeScript support
- **FastMCP**: Performance optimization
- **Figma Context**: Design integration

### 2. AI & Architecture Tools
- **MindsDB**: AI/ML capabilities
- **PydanticAI**: Data validation
- **Smol Developer**: Code generation
- **Gemini Fullstack**: Full-stack development
- **Ollama Python**: Local AI models
- **GPTCache**: AI response caching
- **Sweep AI**: Code refactoring

### 3. Production & Monitoring
- **Pipedream**: Workflow automation
- **Opik**: Observability
- **Task Master**: Project management
- **PentestGPT**: Security testing

### 4. Research & Documentation
- **GPT Researcher**: Market research
- **Anthropic Quickstarts**: Best practices
- **Crawl4AI RAG**: Web crawling
- **Supermemory**: Context retention
- **Bloop**: Code search
- **Context7**: Context management
- **Limware**: Development tools
- **Cua**: Code understanding

## Usage with Claude

The MCPs are configured in `/root/.claude/mcp-config.json` and will be automatically available in your Claude Code environment after installation.

## Project Integration

These MCPs are specifically configured for the Zenith-Fresh cleaning service platform project to help with:
- Real-time booking system development
- AI-powered demand forecasting
- Payment integration workflows
- E2E testing automation
- Performance monitoring
- Security testing
- Market research and competitive analysis