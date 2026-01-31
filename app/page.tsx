"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Lock, LogOut, Github } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

import Explorer from "./components/Explorer";
import EnvViewer from "./components/EnvViewer";
import EnvEditor from "./components/EnvEditor";
import HistoryTable from "./components/HistoryTable";
import LoginScreen from "./components/LoginScreen"; // [NEW]
import { fetchEnv, fetchHistory, pushEnv } from "@/lib/api-client";
import { useToast } from "./components/ToastContext";

interface EnvData {
  project: string;
  service: string;
  environment: string;
  version: number;
  change_reason: string;
  variables: Record<string, string | number>;
}

interface HistoryItem {
  version: number;
  created_at: string;
  created_by: string;
  change_reason: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState<{ p: string, s: string, e: string } | null>(null);
  const [data, setData] = useState<EnvData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [version, setVersion] = useState<number | undefined>(undefined);

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { showToast } = useToast();

  const handleSelectEnv = (p: string, s: string, e: string) => {
    setSelected({ p, s, e });
    setVersion(undefined);
    setIsEditing(false);
    setIsCreating(false);
  };

  const loadData = useCallback(() => {
    if (!selected) return;

    fetchEnv(selected.p, selected.s, selected.e, version)
      .then(setData)
      .catch(err => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any).message?.includes("401") || (err as any).message?.includes("Unauthorized")) {
          showToast("Session Expired. Please login again.", "error");
        } else {
          showToast("Failed to load: " + (err as Error).message, "error");
        }
      });

    fetchHistory(selected.p, selected.s, selected.e)
      .then(res => setHistory(res ? res.history : []))
      .catch(err => console.error(err));
  }, [selected, version, showToast]);

  useEffect(() => {
    if (isEditing || isCreating) return;
    loadData();
  }, [selected, version, isEditing, isCreating, loadData]);

  const handleCreateRef = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelected(null);
  };

  interface EnvFormData {
    project: string;
    service: string;
    environment: string;
    variables: Record<string, string>;
    change_reason: string;
  }

  const handleSave = async (formData: EnvFormData) => {
    try {
      await pushEnv(formData);
      showToast("Saved successfully!", "success");
      setIsEditing(false);
      setIsCreating(false);
      setSelected({ p: formData.project, s: formData.service, e: formData.environment });
      setVersion(undefined);
    } catch (e: unknown) {
      showToast("Failed to save: " + (e instanceof Error ? e.message : String(e)), "error");
    }
  };

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center bg-black text-white">Loading...</div>;
  }

  if (!session) {
    // Show the nice Premium Login Screen instead of the white page
    return <LoginScreen />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[1000px] h-[1000px] bg-blue-500/10 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <div className="flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl w-72 flex-shrink-0 transition-all duration-300">
          <div className="flex items-center p-6 border-b border-white/10">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg mr-3">
              <Lock className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">EnvHub</span>
          </div>

          <div className="flex-1 overflow-y-auto pt-4 px-2">
            <Explorer onSelectEnv={handleSelectEnv} />
          </div>

          <div className="p-4 border-t border-white/10 bg-black/10">
            <div className="flex items-center space-x-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center font-bold text-xs">
                {session?.user?.name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center justify-center w-full text-sm text-gray-400 hover:text-white hover:bg-white/5 py-2 rounded-md transition-colors"
            >
              <LogOut size={14} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Header */}
          <header className="sticky top-0 z-20 backdrop-blur-md bg-black/5 border-b border-white/5 px-8 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selected ? (
                <span className="flex items-center space-x-2">
                  <span className="text-gray-500">Environment</span>
                  <span className="text-gray-600">/</span>
                  <h2 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                    Welcome to <span className="text-blue-600">EnvHub</span>
                  </h2>  <span className="text-white font-medium">{selected.s}</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-blue-400 font-medium">{selected.e}</span>
                </span>
              ) : (
                <span>Dashboard</span>
              )}
            </div>

            <button
              onClick={handleCreateRef}
              className="flex items-center px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
            >
              <Plus size={16} className="mr-2" />
              New Environment
            </button>
          </header>

          <div className="p-8">
            {isCreating ? (
              <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-200">
                <EnvEditor onSave={handleSave} onCancel={() => setIsCreating(false)} />
              </div>
            ) : isEditing && data ? (
              <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-200">
                <EnvEditor
                  initialData={data}
                  onSave={handleSave}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : selected ? (
              <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <EnvViewer data={data} onEdit={() => setIsEditing(true)} />
                <HistoryTable history={history} onSelectVersion={setVersion} currentVersion={data?.version} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4 flex flex-col items-center">
                  <div className="bg-white/5 p-8 rounded-full mb-4 border border-white/10 ring-1 ring-white/5 shadow-2xl">
                    <Lock className="text-blue-400" size={64} />
                  </div>
                  <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
                    Select an Environment
                  </h2>
                  <p className="text-lg text-gray-500 max-w-md mx-auto">
                    Browse your projects on the left or create a new one to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
