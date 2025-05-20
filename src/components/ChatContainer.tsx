'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message } from './Message';
import { ChatInput } from './ChatInput';
import { LoadingIndicator } from './LoadingIndicator';

type MessageType = {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
};

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your MCP Assistant. How can I help you today?'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Add user message to chat
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Parse the response to extract tool calls if any
      const responseText = data.response;
      
      // Check if the response contains tool call information
      if (responseText.includes('Calling tool:')) {
        // Extract tool call information
        const toolCallMatch = responseText.match(/Calling tool: (.*?) with args: (.*?)\n/);
        
        if (toolCallMatch) {
          const toolName = toolCallMatch[1];
          const toolArgs = toolCallMatch[2];
          
          // Add tool message
          const toolMessage: MessageType = {
            id: Date.now().toString() + '-tool',
            role: 'tool',
            content: `Arguments: \`\`\`json\n${toolArgs}\n\`\`\``,
            toolName
          };
          
          setMessages(prev => [...prev, toolMessage]);
          
          // Extract the assistant's final response after the tool call
          const finalResponse = responseText.split(toolCallMatch[0])[1].trim();
          
          // Add assistant message with the final response
          const assistantMessage: MessageType = {
            id: Date.now().toString() + '-assistant',
            role: 'assistant',
            content: finalResponse
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // If we couldn't parse the tool call properly, just add the whole response
          const assistantMessage: MessageType = {
            id: Date.now().toString() + '-assistant',
            role: 'assistant',
            content: responseText
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        // Regular assistant message
        const assistantMessage: MessageType = {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          content: responseText
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Add error message
      const errorMessage: MessageType = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <Message
              key={message.id}
              role={message.role}
              content={message.content}
              toolName={message.toolName}
            />
          ))}
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};
