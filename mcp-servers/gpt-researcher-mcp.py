import os
from gpt_researcher import GPTResearcher

async def research(query):
    researcher = GPTResearcher(query=query, report_type="research_report")
    report = await researcher.conduct_research()
    return report

if __name__ == "__main__":
    print("GPT Researcher MCP Server started")
