import { cn } from "@/lib/utils";
import { useState } from "react";
import { Mail, Lock, User, Phone, ArrowRight, Github, Chrome } from "lucide-react";

export default function AuthSwitch() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate loading for UI
        setTimeout(() => {
            setLoading(false);
            window.location.href = '/'; // Simple redirect for demo
        }, 1500);
    };

    return (
        <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className={cn(
                "absolute top-0 -left-1/4 w-full h-full bg-red-600/20 blur-[100px] rounded-full transition-transform duration-1000 ease-in-out z-0",
                isSignUp ? "translate-x-full bg-blue-600/20" : "-translate-x-1/4"
            )}></div>

            <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
                <div className="space-y-2 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </h1>
                    <p className="text-sm text-neutral-400 font-medium">
                        {isSignUp ? "Sign up to start your journey" : "Enter your credentials to continue"}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex w-full p-1 bg-black/40 rounded-full border border-white/5 relative">
                    <div
                        className={cn(
                            "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-neutral-800 rounded-full shadow-md transition-transform duration-300 ease-out",
                            isSignUp ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                        )}
                    ></div>
                    <button
                        onClick={() => setIsSignUp(false)}
                        className={cn(
                            "flex-1 py-2 text-sm font-semibold rounded-full z-10 transition-colors",
                            !isSignUp ? "text-white" : "text-neutral-400 hover:text-white"
                        )}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setIsSignUp(true)}
                        className={cn(
                            "flex-1 py-2 text-sm font-semibold rounded-full z-10 transition-colors",
                            isSignUp ? "text-white" : "text-neutral-400 hover:text-white"
                        )}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div className="space-y-4">
                        {isSignUp && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
                                    <input
                                        type="tel"
                                        placeholder="Phone"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {!isSignUp && (
                        <div className="flex justify-end">
                            <a href="#" className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
                                Forgot password?
                            </a>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all overflow-hidden relative group",
                            isSignUp ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                        )}
                    >
                        <span className={cn(
                            "absolute inset-0 w-full h-full -ml-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-1000 group-hover:left-full group-hover:ml-0 group-hover:duration-500"
                        )} />
                        {loading ? (
                            <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <>
                                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="w-full relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-neutral-900 px-4 text-neutral-500">Or continue with</span>
                    </div>
                </div>

                {/* Third Party Auth */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-black/30 hover:bg-white/5 transition-colors text-sm font-medium text-neutral-300">
                        <Github className="h-4 w-4" />
                        GitHub
                    </button>
                    <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-black/30 hover:bg-white/5 transition-colors text-sm font-medium text-neutral-300">
                        <Chrome className="h-4 w-4" />
                        Google
                    </button>
                </div>
            </div>
        </div>
    );
}
