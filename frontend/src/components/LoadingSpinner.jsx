import { useState, useEffect } from 'react';

export default function LoadingSpinner() {
    const [showSlowMessage, setShowSlowMessage] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSlowMessage(true);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

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

            {/* Slow loading helper message */}
            {showSlowMessage && (
                <div className="absolute bottom-32 max-w-xs text-center px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500 z-50">
                    <p className="text-[11px] font-medium text-gray-400 leading-relaxed uppercase tracking-wider">
                        ⚡ Waking up the server...
                    </p>
                    <p className="text-[9px] text-gray-500 leading-normal mt-1 uppercase tracking-wider">
                        Our free hosting backend is starting up. This first load may take up to 45 seconds. Thank you for your patience!
                    </p>
                </div>
            )}

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
