import { NextResponse } from 'next/server';
import { BlobManager } from '@/lib/storage';
import { authenticate } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please login with GitHub.' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const project = searchParams.get('project');
        const service = searchParams.get('service');
        const environment = searchParams.get('environment');
        const versionParam = searchParams.get('version');

        if (!project || !service || !environment) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const version = versionParam ? parseInt(versionParam) : undefined;

        const manager = new BlobManager();
        const data = await manager.getBundle(project, service, environment, version);

        if (!data) {
            return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Pull Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
