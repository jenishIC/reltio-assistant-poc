import React, { useState, FormEvent } from 'react';
import { Send } from 'lucide-react';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <Send size={20} />
      </button>
    </form>
  );
};
