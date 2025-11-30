// src/App.tsx
import FretboardGame from './components/FretboardGame';

function App() {
  return (
    // Removed 'bg-slate-900' to allow the component's white theme to take over
    <div className="w-full min-h-screen">
      <FretboardGame />
    </div>
  );
}

export default App;