import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChildEvent } from '../types';
import { Calendar, Clock, MapPin, Plus, X, Edit2, Trash2, Repeat, Gift, Activity, CalendarDays, Check } from 'lucide-react';
import { HapticService } from '../services/HapticService';
import AnimatedSection from './AnimatedSection';

interface ChildEventsProps {
    events: ChildEvent[];
    setEvents: React.Dispatch<React.SetStateAction<ChildEvent[]>>;
}

const EVENT_TYPES = [
    { id: 'birthday', label: 'Birthday', icon: Gift, color: 'bg-pink-500', text: 'text-pink-400' },
    { id: 'activity', label: 'Activity', icon: Activity, color: 'bg-blue-500', text: 'text-blue-400' },
    { id: 'appointment', label: 'Appointment', icon: CalendarDays, color: 'bg-emerald-500', text: 'text-emerald-400' },
    { id: 'other', label: 'Other', icon: Calendar, color: 'bg-slate-500', text: 'text-slate-400' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ChildEvents: React.FC<ChildEventsProps> = ({ events, setEvents }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ChildEvent | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState<ChildEvent['type']>('activity');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringDay, setRecurringDay] = useState<string>('Mon');

    const resetForm = () => {
        setTitle('');
        setType('activity');
        setDate('');
        setTime('');
        setIsRecurring(false);
        setRecurringDay('Mon');
        setEditingEvent(null);
    };

    const handleOpenModal = (event?: ChildEvent) => {
        HapticService.selection();
        if (event) {
            setEditingEvent(event);
            setTitle(event.title);
            setType(event.type);
            setTime(event.time || '');
            setIsRecurring(event.isRecurring);
            if (event.isRecurring) {
                setRecurringDay(event.recurringDay || 'Mon');
            } else {
                setDate(event.date);
            }
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        HapticService.notification();
        const newEvent: ChildEvent = {
            id: editingEvent ? editingEvent.id : Date.now().toString(),
            title,
            type,
            time,
            isRecurring,
            date: isRecurring ? '' : date,
            recurringDay: isRecurring ? recurringDay as any : undefined,
        };

        if (editingEvent) {
            setEvents(prev => prev.map(e => e.id === editingEvent.id ? newEvent : e));
        } else {
            setEvents(prev => [...prev, newEvent]);
        }
        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        HapticService.impact();
        if (window.confirm('Are you sure you want to delete this event?')) {
            setEvents(prev => prev.filter(e => e.id !== id));
        }
    };

    const recurringEvents = useMemo(() => events.filter(e => e.isRecurring), [events]);
    const upcomingEvents = useMemo(() => {
        return events
            .filter(e => !e.isRecurring)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [events]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <AnimatedSection delay={0}>
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Child Events</h3>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 p-2 rounded-full transition-colors"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </AnimatedSection>

            {/* Recurring Activities */}
            {recurringEvents.length > 0 && (
                <AnimatedSection delay={100}>
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Repeat size={12} />
                            Weekly Activities
                        </h4>
                        <div className="grid gap-3">
                            {recurringEvents.map(event => {
                                const typeConfig = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[3];
                                const Icon = typeConfig.icon;
                                return (
                                    <motion.div
                                        key={event.id}
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-slate-800/50 border border-white/5 p-3 rounded-xl flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${typeConfig.color} bg-opacity-20 ${typeConfig.text}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{event.title}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{event.recurringDay}</span>
                                                    {event.time && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {event.time}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleOpenModal(event)}
                                            className="text-slate-500 hover:text-white p-2"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </AnimatedSection>
            )}

            {/* Upcoming Events */}
            <AnimatedSection delay={200}>
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={12} />
                        Upcoming Events
                    </h4>
                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                            <p className="text-xs text-slate-500">No upcoming events scheduled.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {upcomingEvents.map(event => {
                                const typeConfig = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[3];
                                const Icon = typeConfig.icon;
                                const dateObj = new Date(event.date);
                                const isPast = dateObj < new Date(new Date().setHours(0, 0, 0, 0));

                                return (
                                    <motion.div
                                        key={event.id}
                                        whileTap={{ scale: 0.98 }}
                                        className={`bg-slate-800/50 border border-white/5 p-3 rounded-xl flex items-center justify-between group ${isPast ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${typeConfig.color} bg-opacity-20 ${typeConfig.text}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <p className={`font-bold text-sm ${isPast ? 'text-slate-400 line-through' : 'text-white'}`}>{event.title}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {event.time && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {event.time}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenModal(event)}
                                                className="text-slate-500 hover:text-white p-2"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="text-slate-500 hover:text-red-400 p-2"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </AnimatedSection>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    typeof document !== 'undefined' ? (
                        React.createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-[10000]"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-white">{editingEvent ? 'Edit Event' : 'Add Event'}</h3>
                                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Title</label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="e.g. Swimming Lesson"
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Type</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {EVENT_TYPES.map(t => {
                                                    const Icon = t.icon;
                                                    const isSelected = type === t.id;
                                                    return (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => setType(t.id as any)}
                                                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all ${isSelected ? `bg-indigo-500/20 border-indigo-500 ${t.text}` : 'bg-slate-800 border-transparent text-slate-500'}`}
                                                        >
                                                            <Icon size={18} />
                                                            <span className="text-[9px] font-bold">{t.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 text-sm text-white font-medium cursor-pointer">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isRecurring ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                                                    {isRecurring && <Check size={12} className="text-white" />}
                                                </div>
                                                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="hidden" />
                                                Recurring Weekly
                                            </label>
                                        </div>

                                        {isRecurring ? (
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Day of Week</label>
                                                <div className="flex justify-between bg-slate-800 p-1 rounded-xl">
                                                    {DAYS.map(day => (
                                                        <button
                                                            key={day}
                                                            onClick={() => setRecurringDay(day)}
                                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${recurringDay === day ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                        >
                                                            {day.charAt(0)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Date</label>
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Time (Optional)</label>
                                            <input
                                                type="time"
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <button
                                            onClick={handleSave}
                                            disabled={!title || (!isRecurring && !date)}
                                            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl mt-2 transition-colors"
                                        >
                                            {editingEvent ? 'Save Changes' : 'Add Event'}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>,
                            document.body
                        )
                    ) : null
                )}
            </AnimatePresence >
        </div >
    );
};
