import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="fixed inset-0 z-[200000] bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full animate-pulse pointer-events-none"></div>

            <div className="relative flex flex-col items-center gap-12">
                {/* Visual Loader */}
                <div className="relative w-24 h-24">
                    {/* Outer Rotating Ring */}
                    <div className="absolute inset-0 border-[3px] border-white/5 rounded-full"></div>
                    <div className="absolute inset-0 border-[3px] border-transparent border-t-red-600 rounded-full animate-spin"></div>

                    {/* Inner Counter-Rotating Ring */}
                    <div className="absolute inset-4 border-[3px] border-white/5 rounded-full"></div>
                    <div className="absolute inset-4 border-[3px] border-transparent border-t-red-500/50 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>

                    {/* Center Core */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-pulse"></div>
                    </div>
                </div>

                {/* Branding & Status */}
                <div className="flex flex-col items-center gap-3">
                    <div className="text-2xl font-black bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent italic uppercase tracking-tighter">
                        Data Sai
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10"></div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse">
                                Loading Data
                            </span>
                            <div className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-[bounce_1s_infinite_0s]"></span>
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-[bounce_1s_infinite_0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-[bounce_1s_infinite_0.4s]"></span>
                            </div>
                        </div>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10"></div>
                    </div>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-20 capitalize">
                <span className="text-[8px] font-medium text-gray-600 tracking-[0.3em] uppercase">
                    Premium Visual Infrastructure
                </span>
            </div>
        </div>
    );
}
