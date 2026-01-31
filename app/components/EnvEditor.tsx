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
        <form onSubmit={handleSubmit} className="p-6 bg-white shadow-sm rounded-lg border">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                    {isEditing ? "Edit Environment" : "Create New Environment"}
                </h2>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md bg-gray-50"
                        value={project}
                        onChange={e => setProject(e.target.value)}
                        disabled={isEditing}
                        placeholder="my-app"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md bg-gray-50"
                        value={service}
                        onChange={e => setService(e.target.value)}
                        disabled={isEditing}
                        placeholder="backend"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md bg-gray-50"
                        value={environment}
                        onChange={e => setEnvironment(e.target.value)}
                        disabled={isEditing}
                        placeholder="dev" // Could select from dropdown too
                        required
                    />
                </div>
            </div>

            {/* Variables Editor */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Variables</label>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={switchToList}
                            className={`px-3 py-1 text-xs font-medium rounded-md ${mode === "list" ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
                        >
                            List View
                        </button>
                        <button
                            type="button"
                            onClick={switchToBulk}
                            className={`px-3 py-1 text-xs font-medium rounded-md ${mode === "bulk" ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
                        >
                            Bulk Editor
                        </button>
                    </div>
                </div>

                {mode === "list" ? (
                    <div className="space-y-2">
                        <div className="flex justify-end mb-2">
                            <button
                                type="button"
                                onClick={addVar}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                            >
                                <Plus size={16} className="mr-1" /> Add Variable
                            </button>
                        </div>
                        <div className="space-y-2 border rounded-md p-4 bg-gray-50 max-h-96 overflow-y-auto">
                            {vars.map((item, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="KEY"
                                        className="flex-1 px-3 py-2 border rounded-md font-mono text-sm uppercase"
                                        value={item.k}
                                        onChange={(e) => updateVar(index, "k", e.target.value)}
                                    />
                                    <span className="text-gray-400">=</span>
                                    <input
                                        type="text"
                                        placeholder="VALUE"
                                        className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
                                        value={item.v}
                                        onChange={(e) => updateVar(index, "v", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeVar(index)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                        title="Remove"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="border rounded-md p-0 overflow-hidden">
                        <textarea
                            className="w-full h-96 p-4 font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder="PASTE .ENV CONTENT HERE&#10;KEY=VALUE&#10;ANOTHER=123"
                        ></textarea>
                        <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 border-t">
                            Paste your .env file content here. Lines starting with # are ignored.
                        </div>
                    </div>
                )}
            </div>

            {/* Change Reason - Only for updates */}
            {isEditing && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Change Reason (Required)</label>
                    <textarea
                        className="w-full px-3 py-2 border rounded-md"
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
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                >
                    <Save size={16} className="mr-2" />
                    Save Changes
                </button>
            </div>
        </form>
    );
}
