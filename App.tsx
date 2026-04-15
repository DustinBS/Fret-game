import { useState, useEffect } from 'react';
import FretboardGame from './src/components/FretboardGame';
import SandboxMode from './src/components/SandboxMode';
import ChordQuizMode from './src/components/ChordQuizMode';
import GalleryMode from './src/components/GalleryMode';

function App() {
  const [activeTab, setActiveTabState] = useState<'TRAINER' | 'SANDBOX' | 'QUIZ' | 'GALLERY'>('TRAINER');

  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab')?.toUpperCase();
      if (tab && ['TRAINER', 'SANDBOX', 'QUIZ', 'GALLERY'].includes(tab)) {
        setActiveTabState(tab as any);
      } else {
        setActiveTabState('TRAINER');
      }
    };
    
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const setActiveTab = (tab: 'TRAINER' | 'SANDBOX' | 'QUIZ' | 'GALLERY') => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab.toLowerCase());
    window.history.pushState({}, '', '?' + params.toString());
    setActiveTabState(tab);
    window.dispatchEvent(new Event('popstate'));
  };

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
        <button 
          onClick={() => setActiveTab('GALLERY')}
          className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeTab === 'GALLERY' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          Gallery
        </button>
      </nav>

      {activeTab === 'TRAINER' && <FretboardGame />}
      {activeTab === 'SANDBOX' && <SandboxMode />}
      {activeTab === 'QUIZ' && <ChordQuizMode />}
      {activeTab === 'GALLERY' && <GalleryMode />}
    </div>
  );
}

export default App;