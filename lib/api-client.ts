
const API_BASE = '/api';

export async function fetchBrowse(path: string = "") {
    // Browsing not implemented in Vercel Blob easily for now, return empty
    return { keys: [] };
}

export async function fetchEnv(project: string, service: string, env: string, version?: number) {
    let url = `${API_BASE}/pull?project=${project}&service=${service}&environment=${env}`;
    if (version) url += `&version=${version}`;

    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch env");
    return res.json();
}

export async function fetchHistory(project: string, service: string, env: string) {
    const res = await fetch(`${API_BASE}/history?project=${project}&service=${service}&environment=${env}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
}

export async function pushEnv(data: {
    project: string;
    service: string;
    environment: string;
    variables: Record<string, string>;
    change_reason: string;
}) {
    const res = await fetch(`${API_BASE}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to push" }));
        throw new Error(err.detail || "Failed to push env");
    }
    return res.json();
}
