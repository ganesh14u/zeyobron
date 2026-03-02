import React from "react";
import AuthSwitch from "./auth-switch";

export default function Demo() {
    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black p-4">
            {/* Immersive Unsplash Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen grayscale"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2940&auto=format&fit=crop')"
                }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-black" />

            {/* Auth Component Container */}
            <div className="relative z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <AuthSwitch />
            </div>
        </div>
    );
}
