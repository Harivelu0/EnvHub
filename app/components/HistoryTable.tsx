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
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2" /> History
            </h3>
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="py-2 px-4 text-left">Version</th>
                            <th className="py-2 px-4 text-left">User</th>
                            <th className="py-2 px-4 text-left">Reason</th>
                            <th className="py-2 px-4 text-left">Date</th>
                            <th className="py-2 px-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                        {history.map((item) => (
                            <tr key={item.version} className={item.version === currentVersion ? "bg-blue-50" : "hover:bg-gray-50"}>
                                <td className="py-2 px-4 font-mono">{item.version}</td>
                                <td className="py-2 px-4 font-medium text-gray-700">{item.created_by}</td>
                                <td className="py-2 px-4 text-gray-600 truncate max-w-xs">{item.change_reason}</td>
                                <td className="py-2 px-4 text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                                <td className="py-2 px-4 text-right">
                                    <button
                                        onClick={() => onSelectVersion(item.version)}
                                        className="text-blue-600 hover:underline disabled:opacity-50"
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
