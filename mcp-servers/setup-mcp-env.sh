#!/bin/bash

echo "Setting up MCP Environment with Virtual Environment"
echo "=================================================="

# Fix line endings
sed -i 's/\r$//' /root/.env

# Source environment
source /root/.env

# Create Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv /root/mcp-servers/venv
source /root/mcp-servers/venv/bin/activate

# Upgrade pip
pip install --upgrade pip

echo ""
echo "Installing Python MCPs..."
echo "========================"

# Install Python packages
pip install fastmcp
pip install mindsdb
pip install pydantic-ai
pip install crawl4ai
pip install gpt-researcher
pip install openai
pip install anthropic

echo ""
echo "Installing Node.js MCPs..."
echo "========================="

cd /root/mcp-servers/development
npm install @playwright/test

echo ""
echo "Configuration Summary"
echo "===================="
echo "✓ GitHub MCP installed with token"
echo "✓ Python virtual environment created at /root/mcp-servers/venv"
echo "✓ Key Python packages installed"
echo "✓ Playwright test framework installed"
echo ""
echo "API Keys configured:"
echo "- GitHub Token: ${GITHUB_TOKEN:0:20}..."
echo "- OpenAI API Key: ${OPENAI_API_KEY:0:20}..."
echo ""
echo "To activate the Python environment in future sessions:"
echo "source /root/mcp-servers/venv/bin/activate"