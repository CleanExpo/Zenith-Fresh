#!/bin/bash

echo "Installing MCP Servers for Zenith-Fresh Development Environment"
echo "=============================================================="

# Create directories
mkdir -p /root/mcp-servers/{development,ai,monitoring,research}

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install Python if not present
if ! command -v python3 &> /dev/null; then
    echo "Installing Python..."
    apt-get update && apt-get install -y python3 python3-pip
fi

# Install UV for Python package management
if ! command -v uv &> /dev/null; then
    echo "Installing UV..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo ""
echo "1. Installing Development Tools MCPs..."
echo "======================================="

# GitHub MCP
echo "Installing GitHub MCP..."
cd /root/mcp-servers/development
npm init -y
npm install @modelcontextprotocol/server-github

# Playwright MCP
echo "Installing Playwright MCP..."
npm install @modelcontextprotocol/server-playwright
npx playwright install

# TypeScript SDK MCP
echo "Installing TypeScript SDK MCP..."
npm install @modelcontextprotocol/server-typescript

# FastMCP
echo "Installing FastMCP..."
pip install fastmcp

# Figma Context MCP
echo "Installing Figma Context MCP..."
npm install @modelcontextprotocol/server-figma

echo ""
echo "2. Installing Architecture & AI Tools MCPs..."
echo "============================================="

# MindsDB MCP
echo "Installing MindsDB MCP..."
cd /root/mcp-servers/ai
pip install mindsdb-mcp

# PydanticAI MCP
echo "Installing PydanticAI MCP..."
pip install pydantic-ai-mcp

# Smol Developer MCP
echo "Installing Smol Developer MCP..."
npm init -y
npm install @modelcontextprotocol/server-smol-developer

# Gemini Fullstack MCP
echo "Installing Gemini Fullstack MCP..."
npm install @modelcontextprotocol/server-gemini

# Ollama Python MCP
echo "Installing Ollama Python MCP..."
pip install ollama-mcp

# GPTCache MCP
echo "Installing GPTCache MCP..."
pip install gptcache-mcp

# Sweep AI MCP
echo "Installing Sweep AI MCP..."
npm install @modelcontextprotocol/server-sweep

echo ""
echo "3. Installing Production & Monitoring MCPs..."
echo "============================================="

# Pipedream MCP
echo "Installing Pipedream MCP..."
cd /root/mcp-servers/monitoring
npm init -y
npm install @modelcontextprotocol/server-pipedream

# Opik MCP
echo "Installing Opik MCP..."
npm install @modelcontextprotocol/server-opik

# Task Master MCP
echo "Installing Task Master MCP..."
npm install @modelcontextprotocol/server-taskmaster

# PentestGPT MCP
echo "Installing PentestGPT MCP..."
pip install pentestgpt-mcp

echo ""
echo "4. Installing Research & Documentation MCPs..."
echo "=============================================="

# GPT Researcher MCP
echo "Installing GPT Researcher MCP..."
cd /root/mcp-servers/research
pip install gpt-researcher-mcp

# Anthropic Quickstarts MCP
echo "Installing Anthropic Quickstarts MCP..."
npm init -y
npm install @modelcontextprotocol/server-quickstarts

# Crawl4AI RAG MCP
echo "Installing Crawl4AI RAG MCP..."
pip install crawl4ai-mcp

# Supermemory MCP
echo "Installing Supermemory MCP..."
npm install @modelcontextprotocol/server-supermemory

# Bloop MCP
echo "Installing Bloop MCP..."
npm install @modelcontextprotocol/server-bloop

# Context7 MCP
echo "Installing Context7 MCP..."
npm install @modelcontextprotocol/server-context7

# Limware MCP
echo "Installing Limware MCP..."
npm install @modelcontextprotocol/server-limware

# Cua MCP
echo "Installing Cua MCP..."
npm install @modelcontextprotocol/server-cua

echo ""
echo "MCP Installation Complete!"
echo "========================="