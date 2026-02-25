import { useEffect } from 'react';
import '@xyflow/react/dist/style.css';

import { useRevisionStore } from './store/useRevisionStore';
import { RootsView } from './components/features/stats/RootsView';
import { MainTree } from './components/features/tree/MainTree';
import { CalendarView } from './components/features/calendar/CalendarView';
import { SkyView } from './components/features/sky/SkyView';
import { UndergroundView } from './components/features/underground/UndergroundView';
import { Toaster } from 'react-hot-toast';

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

  // Strict 2D navigation using arrow keys (bypasses native getting stuck)
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      // Ignore if user is typing
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

      // Ignore if modifiers are pressed (like user's Ctrl+Shift for window snapping in Roots)
      if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const container = document.getElementById('app-scroll-container');
        if (!container) return;

        e.preventDefault(); // Stop native scroll

        const w = window.innerWidth;
        const h = window.innerHeight;

        // Find closest cell
        const col = Math.round(container.scrollLeft / w);
        const row = Math.round(container.scrollTop / h);

        let newCol = col;
        let newRow = row;

        if (e.key === 'ArrowUp') newRow = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') newRow = Math.min(2, row + 1); // 3 rows
        if (e.key === 'ArrowLeft') newCol = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') {
          if (row === 0) return; // Block right movement into dead cell
          newCol = Math.min(1, col + 1); // 2 columns
        }

        container.scrollTo({
          left: newCol * w,
          top: newRow * h,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyNav, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, []);

  useEffect(() => {
    if (!scrollTarget) return;

    const container = document.getElementById('app-scroll-container');
    if (container) {
      if (scrollTarget === 'sky') {
        container.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      } else if (scrollTarget === 'tree') {
        container.scrollTo({ top: window.innerHeight, left: 0, behavior: 'smooth' });
      } else if (scrollTarget === 'roots') {
        container.scrollTo({ top: window.innerHeight * 2, left: 0, behavior: 'smooth' });
      } else if (scrollTarget === 'calendar') {
        container.scrollTo({ top: window.innerHeight, left: window.innerWidth, behavior: 'smooth' });
      } else if (scrollTarget === 'underground') {
        container.scrollTo({ top: window.innerHeight * 2, left: window.innerWidth, behavior: 'smooth' });
      }
    }

    scrollToArea(null);
  }, [scrollTarget, scrollToArea]);

  // Initial mount scroll: start at the Tree View (middle)
  useEffect(() => {
    const container = document.getElementById('app-scroll-container');
    if (container) {
      // Use 'auto' instead of 'instant' for better cross-browser compatibility
      container.scrollTo({ top: window.innerHeight, left: 0, behavior: 'auto' });
    }
  }, []);

  return (
    <div
      id="app-scroll-container"
      className="w-screen h-screen overflow-auto snap-both snap-mandatory scroll-smooth no-scrollbar relative grid"
      style={{ gridTemplateColumns: '100vw 100vw', gridTemplateRows: '100vh 100vh 100vh' }}
    >
      {/* Row 1: Sky */}
      <div className="w-screen h-screen snap-start snap-always relative overflow-hidden">
        <SkyView />
      </div>
      <div className="w-screen h-screen snap-start snap-always relative overflow-hidden">
        <SkyView />
      </div>

      {/* Row 2: Main Tree and Calendar */}
      <div className="w-screen h-screen snap-start snap-always relative overflow-hidden">
        <MainTree />
      </div>
      <div className="w-screen h-screen snap-start snap-always relative overflow-hidden">
        <CalendarView />
      </div>

      {/* Row 3: Roots and Underground */}
      <div className="w-screen h-screen snap-start snap-always relative overflow-hidden">
        <RootsView />
      </div>
      <div className="w-screen h-screen snap-start snap-always relative overflow-hidden">
        <UndergroundView />
      </div>

      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid #334155',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
      }} />
    </div>
  );
}
