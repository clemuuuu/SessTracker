import React, { useState, useEffect } from 'react';

interface SessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, startTime: string, endTime: string, color: string) => void;
    initialDate?: string; // Pour affichage éventuel
    initialStartTime?: string;
    initialEndTime?: string;
    initialTitle?: string;
    initialColor?: string;
}

const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            options.push(time);
        }
    }
    return options;
};

const TIME_OPTIONS = generateTimeOptions();

const COLORS = [
    { name: 'Amber', class: 'bg-amber-500' },
    { name: 'Cyan', class: 'bg-cyan-500' },
    { name: 'Emerald', class: 'bg-emerald-500' },
    { name: 'Rose', class: 'bg-rose-500' },
    { name: 'Violet', class: 'bg-violet-500' },
    { name: 'Indigo', class: 'bg-indigo-500' },
];

const SessionModal: React.FC<SessionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialTitle = '',
    initialStartTime = '09:00',
    initialEndTime = '10:00',
    initialColor = 'bg-amber-500'
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [startTime, setStartTime] = useState(initialStartTime);
    const [endTime, setEndTime] = useState(initialEndTime);
    const [selectedColor, setSelectedColor] = useState(initialColor);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setStartTime(initialStartTime);
            setEndTime(initialEndTime);
            setSelectedColor(initialColor);
        }
    }, [isOpen, initialTitle, initialStartTime, initialEndTime, initialColor]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title.trim()) {
            alert("Veuillez entrer un titre.");
            return;
        }
        if (startTime >= endTime) {
            alert("L'heure de fin doit être après l'heure de début.");
            return;
        }
        onSave(title, startTime, endTime, selectedColor);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                <h2 className="text-xl font-bold text-white mb-6">
                    {initialTitle ? 'Modifier la session' : 'Nouvelle session'}
                </h2>

                <div className="space-y-4">
                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Titre</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ex: Mathématiques"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Time Selects */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Début</label>
                            <select
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {TIME_OPTIONS.map(time => (
                                    <option key={`start-${time}`} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Fin</label>
                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {TIME_OPTIONS.map(time => (
                                    <option key={`end-${time}`} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Couleur</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setSelectedColor(color.class)}
                                    className={`
                                        w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none
                                        ${color.class}
                                        ${selectedColor === color.class ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''}
                                    `}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionModal;
