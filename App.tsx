import { useState } from 'react';
import FretboardGame from './src/components/FretboardGame';
import SandboxMode from './src/components/SandboxMode';
import ChordQuizMode from './src/components/ChordQuizMode';

function App() {
  const [activeTab, setActiveTab] = useState<'TRAINER' | 'SANDBOX' | 'QUIZ'>('TRAINER');

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Top Navbar */}
      <nav className="flex space-x-4 border-b border-slate-200 px-6 py-3 bg-slate-50">
        <button 
          onClick={() => setActiveTab('TRAINER')}
          className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeTab === 'TRAINER' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          Trainer
        </button>
        <button 
          onClick={() => setActiveTab('SANDBOX')}
          className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeTab === 'SANDBOX' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          Sandbox
        </button>
        <button 
          onClick={() => setActiveTab('QUIZ')}
          className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeTab === 'QUIZ' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          Quiz
        </button>
      </nav>

      {activeTab === 'TRAINER' && <FretboardGame />}
      {activeTab === 'SANDBOX' && <SandboxMode />}
      {activeTab === 'QUIZ' && <ChordQuizMode />}
    </div>
  );
}

export default App;