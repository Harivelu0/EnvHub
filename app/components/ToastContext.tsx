"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center px-4 py-3 rounded-lg shadow-lg border min-w-[300px] animate-fade-in-down
                            ${toast.type === "success" ? "bg-white border-green-200 text-green-800" : ""}
                            ${toast.type === "error" ? "bg-white border-red-200 text-red-800" : ""}
                            ${toast.type === "info" ? "bg-white border-blue-200 text-blue-800" : ""}
                        `}
                    >
                        {toast.type === "success" && <CheckCircle size={20} className="text-green-500 mr-3" />}
                        {toast.type === "error" && <AlertCircle size={20} className="text-red-500 mr-3" />}
                        {toast.type === "info" && <Info size={20} className="text-blue-500 mr-3" />}

                        <span className="flex-1 text-sm font-medium">{toast.message}</span>

                        <button onClick={() => removeToast(toast.id)} className="ml-3 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
