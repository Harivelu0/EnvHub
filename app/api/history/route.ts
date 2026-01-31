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

        if (!project || !service || !environment) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const manager = new BlobManager();
        const history = await manager.listHistory(project, service, environment);

        return NextResponse.json({ history });
    } catch (error) {
        console.error("History Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
