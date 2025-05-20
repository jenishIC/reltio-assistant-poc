import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Path to the Python script (relative to the project root)
    const scriptPath = path.resolve(process.cwd(), './mcp_client_api.py');
    
    // Create a temporary file to store the user message
    const tempFilePath = path.resolve(process.cwd(), 'temp_message.txt');
    
    // Write the message to a temporary file
    fs.writeFileSync(tempFilePath, message);
    
    // Execute the Python script with the message as input
    const { stdout, stderr } = await execPromise(`python3 ${scriptPath} < ${tempFilePath}`);
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    // The MCP client prints connection info to stderr, but it's not an error
    // Only treat it as an error if stdout is empty
    if (stderr && !stdout) {
      console.error('Error executing Python script:', stderr);
      return NextResponse.json(
        { error: 'Error executing Python script', details: stderr },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ response: stdout });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
