import { useEffect } from 'react';
import '@xyflow/react/dist/style.css';

import { useRevisionStore } from './store/useRevisionStore';
import { RootsView } from './components/features/stats/RootsView';
import { MainTree } from './components/features/tree/MainTree';

function App() {
  const {
    tickCallback,
    undo,
    redo
  } = useRevisionStore();

  // Timer tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      tickCallback();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickCallback]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const handleScrollToRoots = () => {
      const container = document.getElementById('app-scroll-container');
      if (container) container.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    };
    const handleScrollToTree = () => {
      const container = document.getElementById('app-scroll-container');
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('scrollToRoots', handleScrollToRoots);
    window.addEventListener('scrollToTree', handleScrollToTree);

    return () => {
      window.removeEventListener('scrollToRoots', handleScrollToRoots);
      window.removeEventListener('scrollToTree', handleScrollToTree);
    };
  }, []);

  return (
    <div
      id="app-scroll-container"
      className="w-screen h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth"
    >
      <MainTree />
      <RootsView />
    </div>
  );
}

// Global scroll handler effect could be here or inside App
// Let's add it inside App


export default App;
