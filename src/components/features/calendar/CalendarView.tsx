import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { GeometricForestBackground } from '../background/GeometricForestBackground';
import { ForestUndergrowth } from '../background/ForestUndergrowth';
import { SessionModal } from './SessionModal';

import { useRevisionStore } from '../../../store/useRevisionStore';

// Helper: Get Monday of the current week for a given date
const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
};

// Helper: Add days to a date
const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// Helper: Format date to "LUN 19/02"
const formatDayHeader = (date: Date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return { name: dayName, date: `${dayNum}/${month}` };
};

// Helper: Format YYYY-MM-DD for storage/comparison
const toISODate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const SESSION_COLORS: Record<string, string> = {
    'bg-amber-500': 'bg-amber-500/20 border-amber-500/30 text-amber-100',
    'bg-cyan-500': 'bg-cyan-500/20 border-cyan-500/30 text-cyan-100',
    'bg-emerald-500': 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100',
    'bg-rose-500': 'bg-rose-500/20 border-rose-500/30 text-rose-100',
    'bg-violet-500': 'bg-violet-500/20 border-violet-500/30 text-violet-100',
    'bg-indigo-500': 'bg-indigo-500/20 border-indigo-500/30 text-indigo-100',
};

export function CalendarView() {
    const { calendarSessions, addSession, deleteSession, scrollToArea } = useRevisionStore();
    const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

    // Generate the 7 days of the current view
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
    };

    const jumpToToday = () => {
        setCurrentWeekStart(getMonday(new Date()));
    };

    const isCurrentWeek = useMemo(() => {
        const todayCommon = getMonday(new Date()).toISOString().split('T')[0];
        const currentCommon = currentWeekStart.toISOString().split('T')[0];
        return todayCommon === currentCommon;
    }, [currentWeekStart]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{ dayIndex: number; date?: string; title: string; startTime: string; endTime: string; initialColor?: string }>({
        dayIndex: 0,
        title: '',
        startTime: '09:00',
        endTime: '10:00',
        initialColor: 'bg-amber-500'
    });
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleSlotClick = (dayIndex: number, dateStr: string) => {
        setModalData({
            dayIndex, // Keep for legacy
            date: dateStr,
            title: '',
            startTime: '09:00',
            endTime: '10:00',
            initialColor: 'bg-amber-500'
        });
        setIsModalOpen(true);
    };

    const handleSaveSession = (title: string, startTime: string, endTime: string, color: string = 'bg-amber-500') => {
        addSession({
            dayIndex: modalData.dayIndex,
            date: modalData.date, // Save the date!
            title,
            startTime,
            endTime,
            color,
            type: 'work'
        });
        setIsModalOpen(false);
    };

    const handleSessionClick = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setConfirmDeleteId(sessionId);
    };

    // Decorative hours for the scale (00:00 to 24:00 with 3h steps)
    const hours = Array.from({ length: 9 }, (_, i) => i * 3); // 0, 3, 6, ... 24

    return (
        <div className="w-full h-full flex flex-col bg-[#0B0F19] text-white overflow-hidden relative font-sans select-none">

            {/* Header / Navigation (Fixed) */}
            <div className="relative z-10 flex items-center justify-between px-8 py-6 w-full">
                <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Forest Scheduler
                </h2>

                {/* Date Navigation Controls */}
                <div className="flex items-center gap-4 bg-slate-900/50 p-1 rounded-lg border border-white/10 backdrop-blur-md">
                    <button
                        onClick={() => navigateWeek('prev')}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors text-slate-300 hover:text-white"
                        title="Previous Week"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <button
                        onClick={jumpToToday}
                        className={`
                            px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                            ${isCurrentWeek ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/10 text-slate-300'}
                        `}
                        title="Jump to Today"
                    >
                        <CalendarIcon size={14} />
                        <span>Today</span>
                    </button>

                    <button
                        onClick={() => navigateWeek('next')}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors text-slate-300 hover:text-white"
                        title="Next Week"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex gap-6 text-sm font-mono text-slate-400">
                    <div>Plan your growth.</div>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="flex-1 w-full relative z-10 p-4 pt-0 flex flex-col overflow-hidden">

                {/* Background aligned via Grid */}
                <div className="absolute inset-x-4 top-0 bottom-4 z-0 grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] pointer-events-none">
                    <div className="border-r border-transparent"></div> {/* Sidebar placeholder */}
                    <div className="col-span-7 relative h-full">
                        <GeometricForestBackground
                            currentDayIndex={isCurrentWeek ? (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) : -1}
                        />
                        <ForestUndergrowth />
                    </div>
                </div>

                {/* Calendar Header (Days) */}
                <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-sm mr-[6px] shrink-0 relative z-10">
                    <div className="border-r border-white/5"></div> {/* Top-left corner */}
                    {weekDays.map((date) => {
                        const { name, date: dateShort } = formatDayHeader(date);
                        const isToday = toISODate(date) === toISODate(new Date());

                        return (
                            <div key={date.toISOString()} className={`text-center py-3 border-r border-white/5 last:border-r-0 ${isToday ? 'text-amber-400 font-bold bg-amber-500/5' : 'text-slate-400'}`}>
                                <div className="text-xs font-mono opacity-70">{name}</div>
                                <div className="text-sm">{dateShort}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] w-full h-full relative z-10">

                    {/* Time Scale Column */}
                    <div className="relative border-r border-white/5 bg-slate-900/30 backdrop-blur-sm z-20 text-[10px] text-slate-500 font-mono text-center select-none cursor-default">
                        {hours.map(hour => (
                            <div
                                key={hour}
                                className="absolute w-full flex items-center justify-center pointer-events-none"
                                style={{
                                    top: `${(hour / 24) * 100}%`,
                                    transform: 'translateY(-50%)' // Center vertically on the point
                                }}
                            >
                                <span className="relative z-10 bg-slate-900/50 px-1 rounded">{hour}:00</span>
                                {/* Small tick mark */}
                                <div className="absolute right-0 w-2 border-t border-slate-500/50"></div>
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {weekDays.map((date, dayIndex) => {
                        const dateStr = toISODate(date);
                        const isToday = dateStr === toISODate(new Date());

                        const daySessions = calendarSessions.filter(s => {
                            if (s.date) {
                                return s.date === dateStr;
                            }
                            // Legacy fallback
                            const jsDay = date.getDay();
                            const ourIndex = jsDay === 0 ? 6 : jsDay - 1;
                            return s.dayIndex === ourIndex;
                        });

                        // Helper to convert "HH:MM" to decimal (0-24)
                        const getSessionStyle = (start: string, end: string) => {
                            const [startH, startM] = start.split(':').map(Number);
                            const [endH, endM] = end.split(':').map(Number);
                            const startDecimal = startH + startM / 60;
                            const endDecimal = endH + endM / 60;

                            const top = (startDecimal / 24) * 100;
                            const height = ((endDecimal - startDecimal) / 24) * 100;

                            return { top: `${top}%`, height: `${height}%` };
                        };

                        return (
                            <div
                                key={dateStr}
                                className={`
                                    relative h-full border-r border-white/5 
                                    transition-colors duration-300 pointer-events-auto
                                    ${isToday ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}
                                `}
                                onClick={(e) => {
                                    if (e.target === e.currentTarget) handleSlotClick(dayIndex, dateStr);
                                }}
                            >
                                {/* Sessions Container */}
                                <div className="absolute inset-0 w-full h-full pointer-events-none">
                                    {daySessions.map(session => {
                                        const style = getSessionStyle(session.startTime, session.endTime);
                                        return (
                                            <div
                                                key={session.id}
                                                onClick={(e) => handleSessionClick(e, session.id)}
                                                style={style}
                                                className={`
                                                    absolute left-1 right-1 rounded-md cursor-pointer border backdrop-blur-md transition-all hover:z-20 hover:scale-[1.02] shadow-lg
                                                    overflow-hidden flex flex-col pointer-events-auto
                                                    ${session.color && SESSION_COLORS[session.color] ? SESSION_COLORS[session.color] : 'bg-slate-700/20 border-slate-500/20 text-slate-100'}
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-0.5 px-2 pt-1">
                                                    <span className="text-[10px] font-mono opacity-90 mix-blend-plus-lighter leading-none">{session.startTime}</span>
                                                </div>
                                                <p className="font-semibold text-xs leading-tight text-shadow-sm px-2 truncate">{session.title}</p>
                                                <p className="text-[9px] opacity-70 px-2 truncate mix-blend-plus-lighter">{session.startTime} - {session.endTime}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Hint (Back to Tree) */}
            <div
                onClick={() => {
                    scrollToArea('treeHorizontal');
                }}
                className="absolute left-8 top-1/2 -translate-y-1/2 animate-bounce opacity-50 text-indigo-300 z-50 cursor-pointer hover:opacity-100 transition-opacity flex items-center gap-3"
            >
                {/* Arrow pointing Left: border-t and border-l visible, rotated 45 deg */}
                <div className="w-6 h-6 border-2 border-indigo-300 rounded-full border-b-0 border-r-0 rotate-[-45deg] transform"></div>
                <span className="text-xs font-mono uppercase tracking-widest hidden md:block">Back to Tree</span>
            </div>

            <SessionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSession}
                initialTitle={modalData.title}
                initialStartTime={modalData.startTime}
                initialEndTime={modalData.endTime}
                initialColor={modalData.initialColor}
            />

            {confirmDeleteId && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 transform transition-all max-w-sm w-full">
                        <h3 className="text-lg font-bold text-white mb-2">Delete session ?</h3>
                        <p className="text-slate-400 mb-6 text-sm">Are you sure you want to delete this session? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm">Cancel</button>
                            <button onClick={() => { deleteSession(confirmDeleteId); setConfirmDeleteId(null); }} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg shadow-lg shadow-red-500/20 transition-all text-sm">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
