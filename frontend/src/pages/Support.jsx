import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNotification } from '../components/Notification';
import { API_URL } from '../config';

export default function Support() {
    const notify = useNotification();
    const messagesEndRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [uploading, setUploading] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (selectedTicket) {
            scrollToBottom();
        }
    }, [selectedTicket?.messages]);
    const [formData, setFormData] = useState({
        type: 'problem',
        subject: '',
        message: ''
    });

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/support/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(response.data);

            // If a ticket is open, update its local state too
            if (selectedTicket) {
                const updated = response.data.find(t => t._id === selectedTicket._id);
                if (updated) setSelectedTicket(updated);
            }
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 5000); // Polling for new messages
        return () => clearInterval(interval);
    }, [selectedTicket?._id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/support`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Support Message Sent Successfully!', 'success');
            setFormData({ type: 'problem', subject: '', message: '' });

            // Immediately open the chat for the new ticket
            if (res.data.data) {
                setSelectedTicket(res.data.data);
            }

            fetchTickets();
        } catch (err) {
            notify(err.response?.data?.message || 'Failed to send message', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || chatLoading) return;

        setChatLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/support/${selectedTicket._id}/message`, {
                content: newMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedTicket(res.data.data);
            setNewMessage('');
            fetchTickets();
        } catch (err) {
            notify('Failed to send message', 'error');
        } finally {
            setChatLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append('image', file);
        setUploading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/support/upload`, fd, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Auto-send image as message
            await axios.post(`${API_URL}/support/${selectedTicket._id}/message`, {
                content: '📷 Attached an image',
                attachments: [res.data.url]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            notify('Image uploaded and sent', 'success');
            fetchTickets();
        } catch (err) {
            notify('Failed to upload image', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleReopenTicket = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/support/${selectedTicket._id}/reopen`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Ticket reopened successfully', 'success');
            fetchTickets();
        } catch (err) {
            notify('Failed to reopen ticket', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-4 md:px-8">
            {/* System Info Alert */}
            <div className="max-w-6xl mx-auto mb-12">
                <div className="bg-red-600/5 border-y border-red-600/10 py-4 backdrop-blur-md rounded-2xl flex justify-center items-center overflow-hidden">
                    <div className="heartbeat-alert px-8">
                        <span className="text-[11px] font-black text-red-600 uppercase tracking-[0.4em] flex items-center gap-4 text-center">
                            <span className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]"></span>
                            NOTICE: ONLY CLOSED TICKETS AND CHAT HISTORY ARE PERMANENTLY DELETED FROM OUR DATABASE AFTER 24 HOURS OF CLOSURE.
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-16">
                {/* Header Section */}
                <div className="text-center space-y-6 relative py-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-red-600/10 blur-[120px] pointer-events-none"></div>
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic text-white leading-none relative z-10">
                        Help & <span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.3)]">Support</span>
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs max-w-lg mx-auto leading-relaxed relative z-10">
                        Tell us about a problem or share your ideas
                    </p>
                </div>

                {/* Support Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                    {/* Left Column: Info Cards */}
                    <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] space-y-6 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl group-hover:bg-red-600/10 transition-colors"></div>
                                <div className="w-16 h-16 rounded-3xl bg-red-600/10 flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform shadow-inner">⚠️</div>
                                <div className="space-y-2">
                                    <h3 className="text-white font-black uppercase tracking-tighter italic text-xl">Report a Problem</h3>
                                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-loose">
                                        Having trouble watching or with your account? We're here to help.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] space-y-6 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl group-hover:bg-yellow-500/10 transition-colors"></div>
                                <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform shadow-inner">💡</div>
                                <div className="space-y-2">
                                    <h3 className="text-white font-black uppercase tracking-tighter italic text-xl">Your Suggestions</h3>
                                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-loose">
                                        Have an idea to make Zeyobron better? Send us your feedback.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-600/20 to-transparent border border-red-600/20 p-10 rounded-[3.5rem] space-y-6 relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-600/20 blur-[80px]"></div>
                            <div className="space-y-2 relative z-10">
                                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Support Team</h4>
                                <p className="text-white font-black text-4xl m-0 uppercase italic tracking-tighter leading-none group-hover:translate-x-1 transition-transform">Fast Reply</p>
                            </div>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-loose relative z-10">
                                Our team usually reviews your messages within 2 hours.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Submission Form */}
                    <div className="lg:col-span-8">
                        <div className="bg-[#080808]/80 backdrop-blur-3xl border border-white/5 rounded-[4rem] p-12 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden h-full">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>

                            <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-6 italic">Inquiry Category</label>
                                        <div className="relative group">
                                            <select
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full px-10 py-6 bg-white/[0.03] border border-white/10 rounded-2xl font-black uppercase text-xs focus:border-red-600 outline-none transition-all appearance-none cursor-pointer text-white shadow-inner"
                                            >
                                                <option value="problem">Problem / Bug</option>
                                                <option value="suggestion">Idea / Suggestion</option>
                                                <option value="other">General Message</option>
                                            </select>
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-red-600 font-bold opacity-50 group-hover:opacity-100 transition-opacity">↓</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-6 italic">Brief Summary</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="WHAT'S HAPPENING?"
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-10 py-6 bg-white/[0.03] border border-white/10 rounded-2xl font-black text-xs focus:border-red-600 outline-none transition-all text-white placeholder:text-gray-800 uppercase tracking-widest"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-6 italic">Comprehensive Details</label>
                                    <textarea
                                        required
                                        placeholder="Describe the context, steps to reproduce, or your vision for improvement..."
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-10 py-8 bg-white/[0.03] border border-white/10 rounded-[3rem] font-medium text-sm focus:border-red-600 outline-none transition-all text-white placeholder:text-gray-800 min-h-[280px] resize-none leading-relaxed"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-8 bg-red-600 text-white font-black uppercase rounded-[2.5rem] shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:bg-red-500 transition-all tracking-[0.4em] text-xs flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>
                                            <span>Send Support Message</span>
                                            <span className="text-xl">→</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Ticket History Section */}
                <div className="space-y-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Your Tickets</h2>
                            <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest">{tickets.length} Saved</span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent ml-8"></div>
                    </div>

                    {tickets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {tickets.map(ticket => (
                                <div
                                    key={ticket._id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className="bg-[#0a0a0a]/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between hover:border-red-600/40 hover:bg-white/[0.02] transition-all group cursor-pointer active:scale-[0.98] shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/[0.02] blur-3xl group-hover:bg-red-600/5 transition-colors"></div>

                                    <div className="space-y-6 relative z-10">
                                        <div className="flex justify-between items-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${ticket.status === 'closed' || ticket.status === 'resolved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                ticket.status === 'reopened' ? 'bg-red-600 text-white shadow-lg' :
                                                    ticket.status === 'reviewed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                        'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-white font-black uppercase tracking-tighter italic text-xl leading-tight group-hover:text-red-500 transition-colors truncate">
                                                {ticket.subject}
                                            </h4>
                                            <div className="flex items-center gap-3">
                                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                                                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">
                                                    {ticket.type.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-gray-500 text-[11px] font-medium leading-relaxed line-clamp-3">
                                            {ticket.message}
                                        </p>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em]">ID: {ticket._id?.slice(-8)}</span>
                                        <span className="text-red-600 text-xs font-black group-hover:translate-x-1 transition-transform">VIEW CHAT →</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[4rem] p-24 text-center space-y-6">
                            <div className="text-6xl opacity-20 group-hover:scale-110 transition-transform">📂</div>
                            <div className="space-y-2">
                                <h3 className="text-white font-black uppercase tracking-tighter italic text-2xl">No Records Identified</h3>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto leading-loose">
                                    Your support history is currently empty. Use the form above to initialize your first support protocol.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Support Chat Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setSelectedTicket(null)}></div>

                    <div className="relative w-full max-w-6xl h-[90vh] bg-[#050505] border border-white/10 rounded-[4rem] shadow-[0_100px_200px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
                        {/* Chat Header */}
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/60 relative z-20">
                            <div className="flex items-center gap-10">
                                <button onClick={() => setSelectedTicket(null)} className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-2xl text-white">←</button>
                                <div>
                                    <div className="flex items-center gap-6 mb-2">
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{selectedTicket.subject}</h3>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' ? 'bg-green-500/20 text-green-500 border border-green-500/20' :
                                            selectedTicket.status === 'reopened' ? 'bg-red-600 text-white shadow-2xl' :
                                                selectedTicket.status === 'reviewed' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/20' :
                                                    'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20'}`}>
                                            {selectedTicket.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] text-gray-600 font-black uppercase tracking-widest">
                                        <span>Official Support Chat</span>
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-gray-800">ID: {selectedTicket._id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 items-center">
                                {(['closed', 'resolved'].includes(selectedTicket.status)) && (
                                    <button
                                        onClick={handleReopenTicket}
                                        className="px-10 py-5 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase hover:bg-red-500 transition-all shadow-[0_10px_40px_rgba(220,38,38,0.4)] animate-in slide-in-from-right-10"
                                    >
                                        REOPEN TICKET
                                    </button>
                                )}
                                <button onClick={() => setSelectedTicket(null)} className="w-16 h-16 rounded-[2rem] bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all shadow-2xl font-black text-xl">✕</button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gradient-to-b from-black via-black/80 to-transparent relative">
                            <div className="absolute top-0 right-0 w-full h-[500px] bg-red-600/[0.01] blur-[150px] pointer-events-none"></div>

                            {selectedTicket.messages?.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.role === 'admin' ? 'items-start animate-in slide-in-from-left-10' : 'items-end animate-in slide-in-from-right-10'}`}>
                                    <div className="flex items-center gap-4 mb-4 px-6 scale-90 opacity-60">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${msg.role === 'admin' ? 'text-red-500' : 'text-gray-300'}`}>
                                            {msg.role === 'admin' ? 'SUPPORT AGENT' : 'YOU'}
                                        </span>
                                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                        <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className={`max-w-[85%] rounded-[3rem] p-10 relative group ${msg.role === 'admin'
                                        ? 'bg-[#111] border border-white/10 text-gray-200 rounded-tl-lg shadow-2xl'
                                        : 'bg-red-600 text-white rounded-tr-lg shadow-[0_30px_60px_rgba(220,38,38,0.2)]'
                                        }`}>
                                        <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                        {msg.attachments?.length > 0 && (
                                            <div className="mt-8 grid grid-cols-1 gap-4">
                                                {msg.attachments.map((url, idx) => (
                                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-white/30 transition-all group-hover:scale-[1.02]">
                                                        <img src={url} alt="attachment" className="w-full h-auto object-cover max-h-96" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />

                            {(['closed', 'resolved'].includes(selectedTicket.status)) && (
                                <div className="text-center py-24 animate-in fade-in zoom-in duration-700">
                                    <div className="bg-[#111] border border-red-600/20 px-16 py-12 rounded-[4rem] inline-block space-y-6 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl"></div>
                                        <div className="text-4xl">🔒</div>
                                        <div className="space-y-4 relative z-10">
                                            <p className="text-xs font-black text-red-500 uppercase tracking-[0.4em] leading-relaxed">
                                                CHAT CLOSED
                                            </p>
                                            <div className="h-px bg-red-600/20 w-16 mx-auto"></div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] italic max-w-sm mx-auto leading-loose">
                                                This ticket is finished. Your chat history will be deleted automatically in 24 hours.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        {!['closed', 'resolved'].includes(selectedTicket.status) && (
                            <div className="p-10 border-t border-white/5 bg-black/80 relative z-30 backdrop-blur-3xl">
                                <form onSubmit={handleSendMessage} className="relative flex items-center gap-6">
                                    <div className="relative flex-1 group">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            placeholder="WRITE YOUR MESSAGE..."
                                            className="w-full px-12 py-7 pr-44 bg-white/[0.03] border border-white/10 rounded-[2.5rem] text-sm font-black uppercase tracking-widest focus:border-red-600 outline-none transition-all placeholder:text-gray-800 resize-none h-20 min-h-[80px] shadow-inner"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
                                            <label className="cursor-pointer p-4 hover:bg-white/10 rounded-2xl transition-all relative group/file active:scale-95">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    disabled={uploading}
                                                />
                                                {uploading ? (
                                                    <span className="w-6 h-6 border-3 border-red-600/30 border-t-red-600 rounded-full animate-spin block"></span>
                                                ) : (
                                                    <span className="text-2xl group-hover/file:scale-110 transition-transform block">📷</span>
                                                )}
                                            </label>
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() || chatLoading}
                                                className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all disabled:opacity-30 shadow-[0_10px_30px_rgba(220,38,38,0.4)] active:scale-90"
                                            >
                                                <span className="text-2xl">→</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                                <div className="flex items-center justify-between mt-6 px-4">
                                    <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.2em]">
                                        Secure Connection Active
                                    </p>
                                    <p className="text-[10px] text-gray-800 font-bold uppercase tracking-widest">
                                        Max Uplink: 5MB
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
