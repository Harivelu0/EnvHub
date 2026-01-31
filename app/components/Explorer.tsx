"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, Folder, Server, RefreshCw } from "lucide-react";
import { fetchBrowse } from "@/lib/api-client";

interface ExplorerProps {
    onSelectEnv: (project: string, service: string, env: string) => void;
}

export default function Explorer({ onSelectEnv }: ExplorerProps) {
    const [projects, setProjects] = useState<string[]>([]);
    const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
    const [services, setServices] = useState<Record<string, string[]>>({});
    const [expandedServices, setExpandedServices] = useState<string[]>([]); // "proj/svc" keys
    const [envs, setEnvs] = useState<Record<string, string[]>>({});

    const loadProjects = useCallback(async () => {
        try {
            const res = await fetchBrowse("");
            setProjects(res.keys ? res.keys.map((k: string) => k.replace(/\/$/, "")) : []);
        } catch (e) {
            console.error(e);
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
            // Load services if not loaded
            if (!services[proj]) {
                try {
                    const res = await fetchBrowse(`env/${proj}`);
                    setServices(prev => ({ ...prev, [proj]: res.keys }));
                } catch (e) {
                    console.error(e);
                }
            }
        }
    };

    const toggleService = async (proj: string, svc: string) => {
        const key = `${proj}/${svc}`;
        if (expandedServices.includes(key)) {
            setExpandedServices(prev => prev.filter(k => k !== key));
        } else {
            setExpandedServices(prev => [...prev, key]);
            // Load envs
            if (!envs[key]) {
                try {
                    const res = await fetchBrowse(`env/${proj}/${svc}`);
                    setEnvs(prev => ({ ...prev, [key]: res.keys }));
                } catch (e) {
                    console.error(e);
                }
            }
        }
    };

    return (
        <div className="px-2 min-h-full relative">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</h2>
                <button onClick={loadProjects} className="text-gray-500 hover:text-white transition-colors" title="Refresh">
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="space-y-1">
                {projects.map(proj => (
                    <div key={proj}>
                        <div className="flex items-center justify-between group">
                            <button
                                onClick={() => toggleProject(proj)}
                                className="flex items-center w-full py-2 px-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg text-left overflow-hidden transition-all duration-200"
                            >
                                {expandedProjects.includes(proj) ? <ChevronDown size={14} className="mr-2 text-gray-500" /> : <ChevronRight size={14} className="mr-2 text-gray-500" />}
                                <Folder size={14} className="mr-2 text-blue-400" />
                                <span className="truncate">{proj}</span>
                            </button>

                        </div>

                        {expandedProjects.includes(proj) && (
                            <div className="ml-2 border-l border-white/10 pl-2 space-y-1 mt-1">
                                {services[proj]?.map(svc => (
                                    <div key={svc}>
                                        <button
                                            onClick={() => toggleService(proj, svc)}
                                            className="flex items-center w-full py-1.5 px-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md text-left transition-all duration-200"
                                        >
                                            {expandedServices.includes(`${proj}/${svc}`) ? <ChevronDown size={14} className="mr-2 text-gray-600" /> : <ChevronRight size={14} className="mr-2 text-gray-600" />}
                                            <Server size={14} className="mr-2 text-purple-400" />
                                            {svc}
                                        </button>

                                        {expandedServices.includes(`${proj}/${svc}`) && (
                                            <div className="ml-2 border-l border-white/10 pl-2 space-y-1 mt-1">
                                                {envs[`${proj}/${svc}`]?.map(env => (
                                                    <button
                                                        key={env}
                                                        onClick={() => onSelectEnv(proj, svc, env)}
                                                        className="flex items-center w-full py-1.5 px-2 text-sm text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md text-left pl-6 transition-all duration-200"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-2 group-hover:bg-blue-400"></span>
                                                        {env}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
