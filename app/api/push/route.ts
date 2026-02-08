
import { NextResponse } from 'next/server';
import { BlobManager } from '@/lib/storage';
import { authenticate } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please login with GitHub.' }, { status: 401 });
        }

        const body = await req.json();
        const { project, service, environment, variables, change_reason } = body;

        // Validate required fields
        if (!project || !service || !environment || !variables) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // SECURITY: Demo User Isolation
        const isDemoUser = user.toLowerCase().includes("demo"); // Matches 'DemoUser' or 'demo@aity.dev'
        if (isDemoUser && project !== "demo-project") {
            return NextResponse.json({ error: 'Demo users can only edit "demo-project".' }, { status: 403 });
        }

        const manager = new BlobManager();

        // --- OPTIMIZATION START: Check for Changes ---
        try {
            const currentBundle = await manager.getBundle(project, service, environment);
            if (currentBundle && JSON.stringify(currentBundle.variables) === JSON.stringify(variables)) {
                console.log(`[Push] No changes detected for ${project}/${service}/${environment}. Skipping save.`);
                return NextResponse.json({
                    status: 'success',
                    version: currentBundle.version,
                    message: 'No changes detected. Version not incremented.'
                });
            }
        } catch (e) {
            console.warn("Error checking current bundle, proceeding with push:", e);
        }
        // --- OPTIMIZATION END ---

        const version = await manager.pushBundle(
            project,
            service,
            environment,
            variables,
            user,
            change_reason || "Updated via API"
        );

        return NextResponse.json({ status: 'success', version });
    } catch (error) {
        console.error("Push Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
