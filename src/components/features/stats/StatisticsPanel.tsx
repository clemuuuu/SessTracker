import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRevisionStore } from '../../../store/useRevisionStore';

export function StatisticsPanel() {
    const { nodes, activeNodeId } = useRevisionStore();

    const activeNode = useMemo(() =>
        nodes.find(n => n.id === activeNodeId),
        [nodes, activeNodeId]
    );

    const data = useMemo(() => {
        const sessions = activeNode?.data?.sessions;
        if (!activeNode || !sessions || !sessions.length) return [];

        // Calculate cumulative time over sessions
        let cumulative = 0;
        return sessions.map((session, index) => {
            const timeStr = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            cumulative += session.duration;
            return {
                name: `Session ${index + 1}`,
                time: timeStr,
                duration: Math.round(session.duration / 60), // minutes
                total: Math.round(cumulative / 60) // minutes
            };
        });
    }, [activeNode]);

    if (!activeNode) {
        return (
            <div className="flex items-center justify-center h-full text-indigo-300/50">
                <p>Select a node to view its roots (statistics)</p>
            </div>
        );
    }

    return (
        <div className="z-10 w-full max-w-4xl p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-indigo-500/30">
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">{activeNode.data.label}</h2>
            <div className="text-sm text-indigo-300 mb-6">
                Total Time: {Math.round(activeNode.data.totalTime / 60)} mins
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#6366F1" tick={{ fill: '#A5B4FC' }} />
                        <YAxis stroke="#6366F1" tick={{ fill: '#A5B4FC' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4338CA', color: '#E0E7FF' }}
                            itemStyle={{ color: '#818CF8' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#818CF8"
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            name="Cumulative (mins)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
