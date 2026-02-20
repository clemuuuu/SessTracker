import { useEffect } from 'react';
import '@xyflow/react/dist/style.css';

import { useRevisionStore } from './store/useRevisionStore';
import { RootsView } from './components/features/stats/RootsView';
import { MainTree } from './components/features/tree/MainTree';
import { CalendarView } from './components/features/calendar/CalendarView';

export function App() {
  const {
    tickCallback,
    undo,
    redo,
    scrollTarget,
    scrollToArea
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
    if (!scrollTarget) return;

    if (scrollTarget === 'roots') {
      const container = document.getElementById('app-scroll-container');
      if (container) container.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    } else if (scrollTarget === 'tree') {
      const container = document.getElementById('app-scroll-container');
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (scrollTarget === 'calendar') {
      const container = document.getElementById('app-horizontal-scroll');
      if (container) container.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
    } else if (scrollTarget === 'treeHorizontal') {
      const container = document.getElementById('app-horizontal-scroll');
      if (container) container.scrollTo({ left: 0, behavior: 'smooth' });
    }

    scrollToArea(null);
  }, [scrollTarget, scrollToArea]);

  return (
    <div
      id="app-scroll-container"
      className="w-screen h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth"
    >
      <div
        id="app-horizontal-scroll"
        className="w-screen h-screen flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth no-scrollbar relative z-10 snap-start"
      >
        <div className="w-screen h-screen flex-shrink-0 snap-start relative overflow-hidden">
          <MainTree />
        </div>
        <div className="w-screen h-screen flex-shrink-0 snap-start relative overflow-hidden">
          <CalendarView />
        </div>
      </div>
      <RootsView />
    </div>
  );
}
