import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#141414] flex items-center justify-center">
            <div className="loader-container">
                <div className="loader"></div>
                <div className="loading-text text-red-600 font-bold uppercase tracking-widest text-sm">
                    Data Sai
                </div>
            </div>
        </div>
    );
}
