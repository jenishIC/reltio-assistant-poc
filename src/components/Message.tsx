import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Wrench } from 'lucide-react';

type MessageProps = {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
};

export const Message: React.FC<MessageProps> = ({ role, content, toolName }) => {
  return (
    <div className={`flex gap-4 p-4 ${role === 'user' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
      <div className="flex-shrink-0">
        {role === 'user' ? (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            <User size={18} />
          </div>
        ) : role === 'tool' ? (
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
            <Wrench size={18} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
            <Bot size={18} />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="font-semibold mb-1">
          {role === 'user' ? 'You' : role === 'tool' ? `Tool: ${toolName || ''}` : 'Assistant'}
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
