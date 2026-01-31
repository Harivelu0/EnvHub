
import { list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

// export const runtime = 'edge'; // Disabled to support getServerSession

// NOTE: BLOB_READ_WRITE_TOKEN is assumed to be available
// For the hackathon, we assume data is stored as "project/service/environment-vX.json"
// We want to list unique directories.

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || '';

    try {
        // List all blobs (limit 1000 for now)
        // Note: Vercel Blob `list` has a `prefix` option but it lists all files recursively under it,
        // it doesn't do "folders" natively. We must emulate folder structure.

        // Strategy: List everything (or with prefix if path is set) and extract the next segments.
        // If path is empty, we look for "project"
        // If path is "project", we look for "project/service"
        // If path is "project/service", we look for "project/service/env"

        const { getServerSession } = await import("next-auth/next");
        const { authOptions } = await import("@/lib/auth-options");
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isDemoUser = session.user.email === "demo@aity.dev" || session.user.name === "DemoUser";

        if (isDemoUser && path === "") {
            return NextResponse.json({ keys: ["demo-project"] });
        }

        if (isDemoUser && path.startsWith("demo-project")) {
            // Allow
        } else if (isDemoUser) {
            return NextResponse.json({ keys: [] });
        }

        const prefix = path ? (path.endsWith('/') ? path : `${path}/`) : '';
        const { blobs } = await list({
            prefix: prefix,
            limit: 1000,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        // Set to collect unique children
        const children = new Set<string>();

        for (const blob of blobs) {
            // Remove the prefix from the blob pathname to get the relative path
            // e.g. blob.pathname = "proj/svc/env-v1.json", prefix = "proj/"
            // relative = "svc/env-v1.json"
            const relative = blob.pathname.slice(prefix.length);

            if (!relative) continue;

            // Take the first segment
            // e.g. relative="svc/env-v1.json" -> "svc"
            const parts = relative.split('/');
            const segment = parts[0];

            // If it ends with -vX.json, it's a file (env version)
            // But for browsing "folders", we usually want the env name.
            // Our storage format: project/service/environment-vX.json

            // If we are at the root (path=""), we expect "project" directories.
            // If we are at "project", we expect "service" directories.
            // If we are at "project/service", we expect "environment" names (stripped of version suffix).

            if (segment) {
                // Heuristic: If we are deep enough, strip -vX.json
                if (path.split('/').length >= 2 && path !== '') {
                    // We are likely inside project/service, looking for environments
                    // Segment is likely "dev-v1.json"
                    const envName = segment.replace(/-v\d+\.json$/, "");
                    children.add(envName);
                } else {
                    // We are looking for projects or services (folders)
                    children.add(segment);
                }
            }
        }

        return NextResponse.json({ keys: Array.from(children).sort() });

    } catch (e: any) {
        console.error("Browse Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
