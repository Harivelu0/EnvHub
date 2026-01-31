"use client";

import { Clock } from "lucide-react";

interface HistoryItem {
    version: number;
    created_at: string;
    created_by: string;
    change_reason: string;
}

interface HistoryTableProps {
    history: HistoryItem[];
    onSelectVersion: (ver: number) => void;
    currentVersion?: number;
}

export default function HistoryTable({ history, onSelectVersion, currentVersion }: HistoryTableProps) {
    if (!history || history.length === 0) return null;

    return (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                <Clock className="w-5 h-5 mr-3 text-blue-400" /> Version History
            </h3>
            <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-black/20 backdrop-blur-sm">
                <table className="w-full text-sm">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Version</th>
                            <th className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                            <th className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
                            <th className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="py-3 px-6 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {history.map((item) => (
                            <tr key={item.version} className={`transition-colors duration-150 ${item.version === currentVersion ? "bg-blue-500/10" : "hover:bg-white/5"}`}>
                                <td className="py-4 px-6 font-mono text-blue-400">v{item.version}</td>
                                <td className="py-4 px-6 font-medium text-gray-300">
                                    <span className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 mr-2 flex items-center justify-center text-[10px] font-bold text-white">
                                            {item.created_by[0].toUpperCase()}
                                        </div>
                                        {item.created_by}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-gray-400 truncate max-w-xs">{item.change_reason}</td>
                                <td className="py-4 px-6 text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                                <td className="py-4 px-6 text-right">
                                    <button
                                        onClick={() => onSelectVersion(item.version)}
                                        className={`text-sm font-medium px-3 py-1 rounded-md transition-all ${item.version === currentVersion
                                                ? "text-blue-400 bg-blue-400/10 cursor-default"
                                                : "text-gray-400 hover:text-white hover:bg-white/10"
                                            }`}
                                        disabled={item.version === currentVersion}
                                    >
                                        {item.version === currentVersion ? "Viewing" : "View"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
