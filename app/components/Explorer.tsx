"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, Folder, Server, RefreshCw } from "lucide-react";
import { fetchBrowse } from "@/lib/api-client";

interface ExplorerProps {
    onSelectEnv: (project: string, service: string, env: string) => void;
}

export default function Explorer({ onSelectEnv, selected }: ExplorerProps & { selected: { p: string, s: string, e: string } | null }) {
    const [projects, setProjects] = useState<string[]>([]);
    const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
    const [services, setServices] = useState<Record<string, string[]>>({});
    const [expandedServices, setExpandedServices] = useState<string[]>([]);
    const [envs, setEnvs] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchBrowse("");
            setProjects(res.keys ? res.keys.map((k: string) => k.replace(/\/$/, "")) : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const toggleProject = async (proj: string) => {
        if (expandedProjects.includes(proj)) {
            setExpandedProjects(prev => prev.filter(p => p !== proj));
        } else {
            setExpandedProjects(prev => [...prev, proj]);
            if (!services[proj]) {
                const res = await fetchBrowse(`${proj}`);
                setServices(prev => ({ ...prev, [proj]: res.keys }));
            }
        }
    };

    const toggleService = async (proj: string, svc: string) => {
        const key = `${proj}/${svc}`;
        if (expandedServices.includes(key)) {
            setExpandedServices(prev => prev.filter(k => k !== key));
        } else {
            setExpandedServices(prev => [...prev, key]);
            if (!envs[key]) {
                const res = await fetchBrowse(`${proj}/${svc}`);
                setEnvs(prev => ({ ...prev, [key]: res.keys }));
            }
        }
    };

    return (
        <div className="px-3 min-h-full pb-10">
            <div className="flex justify-between items-center mb-6 pl-2 pr-1 pt-2">
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workspace</h2>
                <button
                    onClick={loadProjects}
                    disabled={loading}
                    className={`text-gray-500 hover:text-white transition-all p-1.5 rounded-md hover:bg-white/5 ${loading ? "animate-spin text-blue-400" : ""}`}
                    title="Refresh"
                >
                    <RefreshCw size={12} />
                </button>
            </div>

            <div className="space-y-0.5">
                {projects.length === 0 && !loading && (
                    <div className="text-gray-500 text-sm text-center py-8 italic">No projects found</div>
                )}

                {projects.map(proj => {
                    const expanded = expandedProjects.includes(proj);
                    return (
                        <div key={proj} className="select-none">
                            <button
                                onClick={() => toggleProject(proj)}
                                className={`flex items-center w-full py-2 px-3 text-sm rounded-lg text-left transition-all duration-200 group ${expanded ? 'text-white bg-white/5' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                            >
                                <div className={`mr-2.5 transition-transform duration-200 ${expanded ? "rotate-90 text-gray-300" : "text-gray-600 group-hover:text-gray-400"}`}>
                                    <ChevronRight size={12} strokeWidth={3} />
                                </div>
                                <Folder size={14} className={`mr-2.5 ${expanded ? "text-blue-400 fill-blue-400/20" : "text-gray-500 group-hover:text-blue-400/70"}`} />
                                <span className="truncate font-medium tracking-tight">{proj}</span>
                            </button>

                            <div className={`grid transition-all duration-300 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0"}`}>
                                <div className="overflow-hidden">
                                    <div className="ml-3 border-l border-white/5 pl-2 space-y-0.5 mt-1 pb-1">
                                        {services[proj]?.map(svc => {
                                            const svcKey = `${proj}/${svc}`;
                                            const isSvcExpanded = expandedServices.includes(svcKey);
                                            return (
                                                <div key={svc}>
                                                    <button
                                                        onClick={() => toggleService(proj, svc)}
                                                        className={`flex items-center w-full py-1.5 px-3 text-[13px] rounded-md text-left transition-all duration-200 group ${isSvcExpanded ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                                                    >
                                                        <div className={`mr-2 transition-transform duration-200 ${isSvcExpanded ? "rotate-90 text-gray-400" : "text-gray-700 group-hover:text-gray-500"}`}>
                                                            <ChevronRight size={10} strokeWidth={3} />
                                                        </div>
                                                        <Server size={13} className={`mr-2.5 ${isSvcExpanded ? "text-purple-400" : "text-gray-600 group-hover:text-purple-400/70"}`} />
                                                        <span className="truncate">{svc}</span>
                                                    </button>

                                                    {isSvcExpanded && (
                                                        <div className="ml-3 border-l border-white/5 pl-2 space-y-0.5 mt-0.5 mb-1">
                                                            {envs[svcKey]?.map(env => {
                                                                const isSelected = selected?.p === proj && selected?.s === svc && selected?.e === env;
                                                                return (
                                                                    <button
                                                                        key={env}
                                                                        onClick={() => onSelectEnv(proj, svc, env)}
                                                                        className={`flex items-center w-full py-1.5 px-3 text-[13px] rounded-md text-left transition-all duration-200 relative overflow-hidden ${isSelected
                                                                            ? "text-blue-100 bg-blue-500/20 font-medium shadow-[0_0_15px_rgba(59,130,246,0.1)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-4 before:bg-blue-400 before:rounded-full"
                                                                            : "text-gray-500 hover:text-blue-300 hover:bg-blue-500/5"
                                                                            }`}
                                                                    >
                                                                        <span className={`w-1.5 h-1.5 rounded-full mr-2.5 transition-colors ${isSelected ? "bg-blue-400 shadow-[0_0_5px_rgba(59,130,246,0.5)]" : "bg-gray-700 group-hover:bg-gray-500"}`}></span>
                                                                        {env}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
