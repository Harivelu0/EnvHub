import { useState, useEffect } from "react";
import { Copy, Download, FileJson, GitCompare, ArrowRight } from "lucide-react";
import { useToast } from "./ToastContext";
import { fetchEnv } from "@/lib/api-client";

interface EnvData {
    project: string;
    service: string;
    environment: string;
    version: number;
    change_reason: string;
    variables: Record<string, string | number>;
}

interface EnvViewerProps {
    data: EnvData | null;
    onEdit: () => void;
}

type DiffType = "added" | "removed" | "changed" | "unchanged";

interface DiffItem {
    key: string;
    oldValue?: string;
    newValue?: string;
    type: DiffType;
}

export default function EnvViewer({ data, onEdit }: EnvViewerProps) {
    const { showToast } = useToast();
    const [showDiff, setShowDiff] = useState(false);
    const [diffs, setDiffs] = useState<DiffItem[]>([]);
    const [loadingDiff, setLoadingDiff] = useState(false);

    // Reset diff view when data changes
    useEffect(() => {
        setShowDiff(false);
        setDiffs([]);
    }, [data]);

    useEffect(() => {
        if (!showDiff || !data || data.version <= 1) return;

        const loadDiff = async () => {
            setLoadingDiff(true);
            try {
                // @ts-ignore
                const prevData = await fetchEnv(data.project, data.service, data.environment, data.version - 1);

                const currentVars = data.variables;
                const prevVars = prevData ? prevData.variables : {};

                const allKeys = new Set([...Object.keys(currentVars), ...Object.keys(prevVars)]);
                const computedDiffs: DiffItem[] = [];

                allKeys.forEach(key => {
                    const curr = currentVars[key] !== undefined ? String(currentVars[key]) : undefined;
                    const prev = prevVars[key] !== undefined ? String(prevVars[key]) : undefined;

                    if (curr !== undefined && prev === undefined) {
                        computedDiffs.push({ key, newValue: curr, type: "added" });
                    } else if (curr === undefined && prev !== undefined) {
                        computedDiffs.push({ key, oldValue: prev, type: "removed" });
                    } else if (curr !== prev) {
                        computedDiffs.push({ key, oldValue: prev, newValue: curr, type: "changed" });
                    } else {
                        computedDiffs.push({ key, newValue: curr, type: "unchanged" });
                    }
                });

                // Sort: Added/Removed/Changed first, then alphabetical
                computedDiffs.sort((a, b) => {
                    if (a.type === "unchanged" && b.type !== "unchanged") return 1;
                    if (a.type !== "unchanged" && b.type === "unchanged") return -1;
                    return a.key.localeCompare(b.key);
                });

                setDiffs(computedDiffs);
            } catch (error) {
                console.error("Failed to load previous version", error);
                showToast("Failed to load comparison", "error");
                setShowDiff(false);
            } finally {
                setLoadingDiff(false);
            }
        };

        loadDiff();
    }, [showDiff, data, showToast]);

    if (!data) return <div className="p-8 text-gray-400">Select an environment to view</div>;

    const sortedVars = Object.entries(data.variables || {}).sort((a, b) => a[0].localeCompare(b[0]));

    const formatEnv = () => sortedVars.map(([k, v]) => `${k}=${v}`).join("\n");
    const formatJson = () => JSON.stringify(data.variables, null, 2);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!", "success");
    };

    const handleDownload = () => {
        const text = formatEnv();
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.project}-${data.service}-${data.environment}.env`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {data.project} / {data.service.replace(/\/$/, "")} / {data.environment}
                    </h2>
                    <div className="text-sm text-gray-400 mt-2 flex items-center">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/10">v{data.version}</span>
                        <span className="mx-2">•</span>
                        <span>{data.change_reason}</span>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    {data.version > 1 && (
                        <button
                            onClick={() => setShowDiff(!showDiff)}
                            className={`flex items-center px-4 py-2 text-xs font-medium rounded-lg border transition-all ${showDiff
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                                }`}
                            title="Compare with previous version"
                        >
                            <GitCompare size={14} className="mr-2" />
                            {showDiff ? "Hide Changes" : "Show Changes"}
                        </button>
                    )}

                    {!showDiff && (
                        <>
                            <button
                                onClick={() => handleCopy(formatEnv())}
                                className="flex items-center px-4 py-2 text-xs font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Copy size={14} className="mr-2" />
                                .env
                            </button>
                            <button
                                onClick={() => handleCopy(formatJson())}
                                className="flex items-center px-4 py-2 text-xs font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <FileJson size={14} className="mr-2" />
                                JSON
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex items-center px-4 py-2 text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg transition-colors"
                            >
                                <Download size={14} className="mr-2" />
                                Download
                            </button>
                            <button
                                onClick={onEdit}
                                className="flex items-center px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                            >
                                Edit
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                {showDiff ? (
                    loadingDiff ? (
                        <div className="text-center py-12 text-gray-500 animate-pulse">Calculating differences...</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="py-3 px-6 font-semibold text-gray-400 w-1/4">Key</th>
                                    <th className="py-3 px-6 font-semibold text-gray-400">Change</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {diffs.map((diff) => (
                                    <tr key={diff.key} className={`
                                    ${diff.type === 'added' ? 'bg-green-500/10' : ''}
                                    ${diff.type === 'removed' ? 'bg-red-500/10' : ''}
                                    ${diff.type === 'changed' ? 'bg-yellow-500/10' : ''}
                                    hover:bg-white/5 transition-colors
                                `}>
                                        <td className="py-3 px-6 font-mono font-medium text-gray-300">
                                            {diff.type === 'added' && <span className="text-green-400 mr-2 font-bold">+</span>}
                                            {diff.type === 'removed' && <span className="text-red-400 mr-2 font-bold">-</span>}
                                            {diff.type === 'changed' && <span className="text-yellow-400 mr-2 font-bold">~</span>}
                                            {diff.key}
                                        </td>
                                        <td className="py-3 px-6 font-mono break-all text-gray-400">
                                            {diff.type === 'added' && <div className="text-green-400">{diff.newValue}</div>}
                                            {diff.type === 'removed' && <div className="text-red-400 line-through decoration-red-500/50">{diff.oldValue}</div>}
                                            {diff.type === 'changed' && (
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className="bg-red-500/20 text-red-300 px-1 rounded line-through text-xs border border-red-500/20">{diff.oldValue}</span>
                                                    <ArrowRight size={12} className="text-gray-500" />
                                                    <span className="bg-green-500/20 text-green-300 px-1 rounded text-xs border border-green-500/20">{diff.newValue}</span>
                                                </div>
                                            )}
                                            {diff.type === 'unchanged' && <div className="text-gray-600">{diff.newValue}</div>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="py-3 px-6 font-semibold text-gray-400 w-1/4">Key</th>
                                <th className="py-3 px-6 font-semibold text-gray-400">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedVars.map(([key, value]) => (
                                <tr key={key} className="hover:bg-white/5 transition-colors group">
                                    <td className="py-3 px-6 font-mono text-purple-400 font-medium group-hover:text-purple-300 transition-colors">{key}</td>
                                    <td className="py-3 px-6 font-mono text-gray-300 break-all">{String(value)}</td>
                                </tr>
                            ))}
                            {sortedVars.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="py-8 px-6 text-center text-gray-500 italic">No variables found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
