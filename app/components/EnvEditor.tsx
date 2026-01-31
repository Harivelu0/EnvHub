"use client";

import { useState } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";

interface EnvEditorProps {
    initialData?: {
        project: string;
        service: string;
        environment: string;
        variables: Record<string, string | number>;
    };
    onSave: (data: {
        project: string;
        service: string;
        environment: string;
        variables: Record<string, string>;
        change_reason: string;
    }) => void;
    onCancel: () => void;
}

export default function EnvEditor({ initialData, onSave, onCancel }: EnvEditorProps) {
    const isEditing = !!initialData;

    const [project, setProject] = useState(initialData?.project || "");
    const [service, setService] = useState(initialData?.service || "");
    const [environment, setEnvironment] = useState(initialData?.environment || "");
    const [changeReason, setChangeReason] = useState(initialData ? "" : "Initial creation");

    const [mode, setMode] = useState<"list" | "bulk">("list");
    const [bulkText, setBulkText] = useState("");

    // Convert object to array for easier editing
    const [vars, setVars] = useState<{ k: string; v: string }[]>(
        initialData
            ? Object.entries(initialData.variables).map(([k, v]) => ({ k, v: String(v) }))
            : [{ k: "", v: "" }]
    );

    const addVar = () => setVars([...vars, { k: "", v: "" }]);

    const removeVar = (index: number) => {
        const newVars = vars.filter((_, i) => i !== index);
        setVars(newVars);
    };

    const updateVar = (index: number, field: "k" | "v", value: string) => {
        const newVars = [...vars];
        if (field === "k") {
            // Auto-uppercase and strict regex for keys
            value = value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
        }
        newVars[index][field] = value;
        setVars(newVars);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalVars = vars;

        // If in bulk mode, sync back to vars first (simulated)
        if (mode === "bulk") {
            const lines = bulkText.split("\n");
            finalVars = [];
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#")) continue;
                const idx = trimmed.indexOf("=");
                if (idx === -1) continue;
                const k = trimmed.substring(0, idx).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
                const v = trimmed.substring(idx + 1).trim();
                if (k) finalVars.push({ k, v });
            }
        }

        if (!project || !service || !environment || !changeReason) {
            alert("Please fill in all required fields.");
            return;
        }

        const variables: Record<string, string> = {};
        for (const item of finalVars) {
            if (item.k) {
                variables[item.k] = item.v;
            }
        }

        if (Object.keys(variables).length === 0) {
            alert("At least one variable is required.");
            return;
        }

        onSave({
            project,
            service,
            environment,
            variables,
            change_reason: changeReason,
        });
    };

    const switchToBulk = () => {
        const text = vars
            .filter(v => v.k)
            .map(v => `${v.k}=${v.v}`)
            .join("\n");
        setBulkText(text);
        setMode("bulk");
    };

    const switchToList = () => {
        const lines = bulkText.split("\n");
        const newVars: { k: string; v: string }[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;

            const idx = trimmed.indexOf("=");
            if (idx === -1) continue;

            const k = trimmed.substring(0, idx).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
            const v = trimmed.substring(idx + 1).trim();

            if (k) newVars.push({ k, v });
        }

        if (newVars.length === 0) newVars.push({ k: "", v: "" });

        setVars(newVars);
        setMode("list");
    };

    return (

        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit} className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {isEditing ? "Edit Environment" : "Create New Environment"}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {isEditing ? "Modify existing variables and save a new version." : "Add a new environment configuration."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            value={project}
                            onChange={e => setProject(e.target.value)}
                            disabled={isEditing}
                            placeholder="my-app"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            value={service}
                            onChange={e => setService(e.target.value)}
                            disabled={isEditing}
                            placeholder="backend"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Environment</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                            value={environment}
                            onChange={e => setEnvironment(e.target.value)}
                            disabled={isEditing}
                            placeholder="dev"
                            required
                        />
                    </div>
                </div>

                {/* Variables Editor */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-semibold text-gray-300">Environment Variables</label>
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                            <button
                                type="button"
                                onClick={switchToList}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${mode === "list" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
                            >
                                List View
                            </button>
                            <button
                                type="button"
                                onClick={switchToBulk}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${mode === "bulk" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
                            >
                                Bulk Editor
                            </button>
                        </div>
                    </div>

                    {mode === "list" ? (
                        <div className="space-y-3">
                            <div className="space-y-3 p-4 bg-black/20 rounded-xl border border-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {vars.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-center group animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                placeholder="KEY"
                                                className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-lg font-mono text-sm text-blue-300 placeholder-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500/50 uppercase"
                                                value={item.k}
                                                onChange={(e) => updateVar(index, "k", e.target.value)}
                                            />
                                        </div>
                                        <span className="text-gray-600 font-mono">=</span>
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                placeholder="VALUE"
                                                className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-lg font-mono text-sm text-gray-300 placeholder-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                                value={item.v}
                                                onChange={(e) => updateVar(index, "v", e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeVar(index)}
                                            className="text-gray-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/10"
                                            title="Remove"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addVar}
                                className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center text-sm font-medium"
                            >
                                <Plus size={16} className="mr-2" /> Add Variable
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <textarea
                                className="w-full h-96 p-6 font-mono text-sm bg-black/40 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition leading-relaxed resize-none"
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                placeholder="PASTE .ENV CONTENT HERE&#10;KEY=VALUE&#10;ANOTHER=123"
                                spellCheck={false}
                            ></textarea>
                            <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                                .env format supported
                            </div>
                        </div>
                    )}
                </div>

                {/* Change Reason - Only for updates */}
                {isEditing && (
                    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Change Reason <span className="text-red-400">*</span></label>
                        <textarea
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                            rows={2}
                            value={changeReason}
                            onChange={e => setChangeReason(e.target.value)}
                            placeholder="e.g. Added feature flags for V2"
                            minLength={5}
                            required
                        ></textarea>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center"
                    >
                        <Save size={18} className="mr-2" />
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
