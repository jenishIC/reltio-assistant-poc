import asyncio
import os
import sys
from typing import List, Dict, Optional
from collections import deque
from contextlib import AsyncExitStack
from openai import AsyncOpenAI
import openai
from mcp import ClientSession
from mcp.client.sse import sse_client
import json

# ─── CONFIGURATION ──────────────────────────────────────────────────────────────
OPENAI_API_KEY: str     = "sk-5_mtcSXx80f3CylZlQOfzOR7LRdKzaUxWzb19-g3mZT3BlbkFJewlDYpWMjeg8CKzyVCHaJ3hqEv2v58T17bnMcyKIoA"
SERVER_URL: str         = "http://3.92.191.242:8000/sse" #MCP Server URL
MODEL_NAME: str         ="gpt-4o" # OpenAI Model ID (e.g., gpt-4o, gpt-3.5-turbo)
HISTORY_SIZE: int       = 5  # number of user+assistant exchanges to keep
# ────────────────────────────────────────────────────────────────────────────────


class MCPOpenAIClient:
    """
    MCPOpenAIClient keeps an SSE connection to an MCP server,
    wraps MCP tools as OpenAI functions, and processes a single message.
    """

    def __init__(self) -> None:
        self._streams_ctx: Optional[AsyncExitStack] = None
        self._session_ctx: Optional[AsyncExitStack] = None
        self.session: Optional[ClientSession] = None
        self.openai_client: Optional[AsyncOpenAI] = AsyncOpenAI(api_key=OPENAI_API_KEY)
        self.history: deque = deque(maxlen=HISTORY_SIZE * 2)

    async def connect(self, server_url: str = SERVER_URL) -> None:
        """Open SSE → MCP session, list tools."""
        self._streams_ctx = sse_client(url=server_url)
        streams = await self._streams_ctx.__aenter__()

        self._session_ctx = ClientSession(*streams)
        self.session = await self._session_ctx.__aenter__()
        await self.session.initialize()

        tools = (await self.session.list_tools()).tools
        print(f"🔗 Connected to MCP—available tools: {[t.name for t in tools]}", file=sys.stderr)

    async def cleanup(self) -> None:
        """Exit MCP session & SSE."""
        if self._session_ctx:
            await self._session_ctx.__aexit__(None, None, None)
        if self._streams_ctx:
            await self._streams_ctx.__aexit__(None, None, None)

    def _build_tools(self, tools) -> List[Dict]:
        """
        Convert MCP tool metadata into OpenAI function schemas.
        Each tool.inputSchema is assumed to be a valid JSON Schema.
        """
        functions = []
        for t in tools:
            functions.append({
                "type": "function",
                "function":{
                "name": t.name,
                "description": t.description,
                "parameters": t.inputSchema
                }
            })
        return functions

    async def process(self, user_query: str) -> str:
        """
        Send the user_query to OpenAI, handle any function_call,
        execute the tool, and return the assistant's final reply.
        """

        self.history.append({"role": "user", "content": user_query})

        mcp_tools = (await self.session.list_tools()).tools
        tools = self._build_tools(mcp_tools)
        reply=""
        response = await self.openai_client.chat.completions.create(
            model=MODEL_NAME,
            messages=list(self.history),
            tools=tools,
            tool_choice="auto"
        )
        msg = response.choices[0].message

        tool_calls = msg.tool_calls
        if tool_calls:
            for tool_call in tool_calls:
                fname = tool_call.function.name
                fargs_str = tool_call.function.arguments
                try:
                    fargs = json.loads(fargs_str)
                except json.JSONDecodeError:
                    fargs = {}

                # Call the tool
                reply+= f"\nCalling tool: {fname} with args: {fargs_str}\n"
                tool_result = await self.session.call_tool(fname, fargs)

                self.history.append({
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [ 
                        {
                            "id": tool_call.id,
                            "type": "function",
                            "function": {
                                "name": fname,
                                "arguments": fargs_str
                            }
                        }
                    ]
                })

                self.history.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": fname,
                    "content": str(tool_result)
                })

            followup = await self.openai_client.chat.completions.create(
                model=MODEL_NAME,
                messages=list(self.history)
            )
            final_msg = followup.choices[0].message
            reply+= final_msg.content or ""
        else:
            # No function call: direct response
            reply+= msg.content or ""

        self.history.append({"role": "assistant", "content": reply})
        return reply

    async def process_single_message(self) -> None:
        """Process a single message from stdin."""
        try:
            # Read message from stdin
            user_in = sys.stdin.read().strip()
            if not user_in:
                print("Error: No input provided", file=sys.stderr)
                return
                
            # Connect to MCP server
            await self.connect()
            
            # Process the message
            answer = await self.process(user_in)
            
            # Print the answer to stdout
            print(answer)
        except Exception as exc:
            print(f"Error: {exc}", file=sys.stderr)
        finally:
            # Clean up
            await self.cleanup()


if __name__ == "__main__":
    asyncio.run(MCPOpenAIClient().process_single_message())
