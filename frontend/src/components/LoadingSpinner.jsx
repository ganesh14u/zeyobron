import React from 'react';

export default function LoadingSpinner() {
    return (
        <div id="global-loader" className="fixed inset-0 z-[200000] bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full animate-pulse pointer-events-none"></div>

            {/* From Uiverse.io by dexter-st */}
            <div className="loader-wrapper scale-[1.2] md:scale-[2]">
                <span className="loader-letter">L</span>
                <span className="loader-letter">o</span>
                <span className="loader-letter">a</span>
                <span className="loader-letter">d</span>
                <span className="loader-letter">i</span>
                <span className="loader-letter">n</span>
                <span className="loader-letter">g</span>
                <span className="loader-letter">.</span>
                <span className="loader-letter">.</span>
                <span className="loader-letter">.</span>

                <div className="loader"></div>
            </div>

            {/* Branding Subtext */}
            <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-2 opacity-30">
                <div className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">
                    Data Sai
                </div>
                <div className="text-[8px] font-medium text-gray-500 tracking-[0.3em] uppercase">
                    Premium Visual Infrastructure
                </div>
            </div>
        </div>
    );
}
