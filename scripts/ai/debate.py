#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.error
import time

# Configuration
MODEL = "qwen2.5-coder:7b"
API_URL = "http://localhost:11434/api/generate"

def query_ollama(system_prompt, user_prompt):
    payload = {
        "model": MODEL,
        "stream": False,
        "options": {"temperature": 0.7}, # Higher temp for creativity
        "system": system_prompt,
        "prompt": user_prompt
    }
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(API_URL, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('response', '').strip()
    except Exception as e:
        return f"Error: {e}"

def main():
    if len(sys.argv) < 2:
        topic = input("Enter the topic/feature to debate: ")
    else:
        topic = " ".join(sys.argv[1:])

    print(f"\n🎙️  \033[1mStarting Debate on: {topic}\033[0m\n")

    # ROUND 1: The Architect (Idealist)
    print("🎩  \033[34mArchitect (Ralph) is thinking...\033[0m")
    architect_prompt = "You are Ralph, a Senior Software Architect. You care about scalability, clean code, design patterns, and long-term maintainability. You are skeptical of quick hacks. Critique the following idea and propose a robust, scalable technical design."
    architect_response = query_ollama(architect_prompt, topic)
    print(f"\n{architect_response}\n")

    # ROUND 2: The Hacker (Pragmatist)
    print("⚡️  \033[33mHacker (Fast Eddie) is responding...\033[0m")
    hacker_prompt = f"You are Fast Eddie, a pragmatic startup engineer. You care about speed, shipping today, and MVPs. You find Architects too slow. unexpected complexity is bad. Read Ralph's design below and critique it. Propose a simpler, faster way to ship this feature NOW.\n\nRalph's Design:\n{architect_response}"
    hacker_response = query_ollama(hacker_prompt, topic)
    print(f"\n{hacker_response}\n")

    # ROUND 3: The Tech Lead (Synthesis)
    print("⚖️   \033[32mTech Lead is synthesizing...\033[0m")
    lead_prompt = f"You are the Tech Lead. Your goal is to make a decision. Read the debate below between Ralph (Architect) and Eddie (Hacker). Propose a final Implementation Plan that balances speed and quality. Output a checklist of files to create/modify.\n\nTopic: {topic}\n\nRalph: {architect_response}\n\nEddie: {hacker_response}"
    final_decision = query_ollama(lead_prompt, "Synthesize the plan.")
    
    print("\n---------------------------------------------------")
    print("\n📝  \033[1mFINAL DECISION:\033[0m")
    print(final_decision)
    print("\n---------------------------------------------------")

if __name__ == "__main__":
    main()
