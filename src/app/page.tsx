import { ChatContainer } from '@/components/ChatContainer';

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">MCP Assistant</h1>
        <p className="text-sm opacity-80">A Next.js UI for the MCP client</p>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  );
}
