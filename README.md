# MCP Assistant

A Next.js UI for the MCP (Model Context Protocol) client. This application provides a chat interface for interacting with an MCP server through a Python client.

## Features

- Chat interface for interacting with the MCP client
- Display of assistant responses
- Visualization of tool calls and their results
- Responsive design that works on desktop and mobile

## Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Python 3.8 or later
- pip (Python package manager)

## Setup

### 1. Install JavaScript dependencies

```bash
npm install
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure the MCP client

The MCP client configuration is in `mcp_client_api.py`. You may need to update:

- `OPENAI_API_KEY`: Your OpenAI API key
- `SERVER_URL`: The URL of your MCP server
- `MODEL_NAME`: The OpenAI model to use (e.g., gpt-4o, gpt-3.5-turbo)
- `HISTORY_SIZE`: Number of user+assistant exchanges to keep in history

## Running the Application

1. Start the Next.js development server:

```bash
npm run dev
```

2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Type your message in the input field at the bottom of the chat interface
2. Press Enter or click the Send button to send your message
3. The assistant will process your message and respond
4. If the assistant uses any tools, they will be displayed in the chat

## Architecture

- **Frontend**: Next.js with React and TypeScript
- **Backend**: Next.js API routes that execute the Python MCP client
- **MCP Client**: Python client that connects to the MCP server and processes messages

## License

MIT
