import { useState, useEffect, type MouseEvent } from 'react';
import { useGlobalKeyConstraint } from './src/hooks/useGlobalKey';
import FretboardGame from './src/components/FretboardGame';
import SandboxMode from './src/components/SandboxMode';
import ChordQuizMode from './src/components/ChordQuizMode';
import GalleryMode from './src/components/GalleryMode';
import VisualArchetypeMode from './src/components/VisualArchetypeMode';
import { KEY_CONSTRAINT_OPTIONS, getKeySignatureInfo } from './src/utils/musicTheory';
import { buildSearchWithUpdates, navigateFromClick, preventMiddleMouseDefault } from './src/utils/queryNavigation';

function App() {
  const [activeTab, setActiveTabState] = useState<'TRAINER' | 'SANDBOX' | 'QUIZ' | 'GALLERY' | 'VISUAL_ARCHETYPE'>('TRAINER');
  const [globalKey, setGlobalKey] = useGlobalKeyConstraint('C');
  const [useGalleryColors, setUseGalleryColors] = useState<boolean>(() => {
    return localStorage.getItem('fret-gallery-colors') !== 'off';
  });
  const galleryKeyInfo = getKeySignatureInfo(globalKey);
  const showGalleryContext = activeTab === 'GALLERY' || activeTab === 'VISUAL_ARCHETYPE';

  useEffect(() => {
    localStorage.setItem('fret-gallery-colors', useGalleryColors ? 'on' : 'off');
  }, [useGalleryColors]);

  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab')?.toUpperCase();
      if (!tab) {
        setActiveTabState('TRAINER');
        return;
      }

      if (tab === 'VISUAL' || tab === 'VISUALARCHETYPE') {
        setActiveTabState('VISUAL_ARCHETYPE');
        return;
      }

      if (['TRAINER', 'SANDBOX', 'QUIZ', 'GALLERY'].includes(tab)) {
        setActiveTabState(tab as 'TRAINER' | 'SANDBOX' | 'QUIZ' | 'GALLERY');
      } else {
        setActiveTabState('TRAINER');
      }
    };
    
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const getTabSearch = (tab: 'TRAINER' | 'SANDBOX' | 'QUIZ' | 'GALLERY' | 'VISUAL_ARCHETYPE') => {
    return buildSearchWithUpdates({ tab: tab === 'VISUAL_ARCHETYPE' ? 'visualarchetype' : tab.toLowerCase() });
  };

  const handleTabClick = (
    event: MouseEvent<HTMLButtonElement>,
    tab: 'TRAINER' | 'SANDBOX' | 'QUIZ' | 'GALLERY' | 'VISUAL_ARCHETYPE',
  ) => {
    navigateFromClick(event, getTabSearch(tab));
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Top Navbar */}
      <nav className="flex space-x-4 border-b border-slate-200 px-6 py-3 bg-slate-50 items-center">
        <button 
          onClick={(event) => handleTabClick(event, 'TRAINER')}
          onAuxClick={(event) => handleTabClick(event, 'TRAINER')}
          onMouseDown={preventMiddleMouseDefault}
          className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeTab === 'TRAINER' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          Trainer
        </button>
        <button 
          onClick={(event) => handleTabClick(event, 'SANDBOX')}
          onAuxClick={(event) => handleTabClick(event, 'SANDBOX')}
          onMouseDown={preventMiddleMouseDefault}
          className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeTab === 'SANDBOX' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          Sandbox
        </button>
        <button 
          onClick={(event) => handleTabClick(event, 'QUIZ')}
          onAuxClick={(event) => handleTabClick(event, 'QUIZ')}
          onMouseDown={preventMiddleMouseDefault}
          className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeTab === 'QUIZ' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          Quiz
        </button>
        <button 
          onClick={(event) => handleTabClick(event, 'GALLERY')}
          onAuxClick={(event) => handleTabClick(event, 'GALLERY')}
          onMouseDown={preventMiddleMouseDefault}
          className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeTab === 'GALLERY' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          Gallery
        </button>
        <button 
          onClick={(event) => handleTabClick(event, 'VISUAL_ARCHETYPE')}
          onAuxClick={(event) => handleTabClick(event, 'VISUAL_ARCHETYPE')}
          onMouseDown={preventMiddleMouseDefault}
          className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeTab === 'VISUAL_ARCHETYPE' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          Visual Archetype
        </button>

        <div className="flex-1" /> {/* Spacer */}
        
        <div className="flex items-center gap-2">
            {showGalleryContext && (
              <div className="flex items-center gap-1 text-xs font-bold tracking-wider text-slate-500">
                <span className="uppercase">Current Key:</span>
                {galleryKeyInfo.keyName !== galleryKeyInfo.renderableKeyName ? (
                  <>
                    <span className="line-through text-slate-400">{galleryKeyInfo.keyName}</span>
                    <span className="text-blue-700">{galleryKeyInfo.renderableKeyName}</span>
                  </>
                ) : (
                  <span className="text-blue-700">{galleryKeyInfo.keyName}</span>
                )}
              </div>
            )}
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Gallery Key:</span>
            <select 
              value={globalKey} 
              onChange={(e) => setGlobalKey(e.target.value)} 
              className="bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[60px]"
            >
              {KEY_CONSTRAINT_OPTIONS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <button
              onClick={() => setUseGalleryColors(prev => !prev)}
              aria-pressed={useGalleryColors}
              className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border transition-colors ${useGalleryColors ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
            >
              Gallery Colors
            </button>
        </div>
      </nav>

      {activeTab === 'TRAINER' && <FretboardGame />}
      {activeTab === 'SANDBOX' && <SandboxMode />}
      {activeTab === 'QUIZ' && <ChordQuizMode />}
      {activeTab === 'GALLERY' && <GalleryMode keyConstraint={globalKey} setKeyConstraint={setGlobalKey} useGalleryColors={useGalleryColors} />}
      {activeTab === 'VISUAL_ARCHETYPE' && <VisualArchetypeMode keyConstraint={globalKey} useGalleryColors={useGalleryColors} />}
    </div>
  );
}

export default App;