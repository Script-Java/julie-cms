import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getZohoEmailContent } from '@/utils/zoho/mail';

export async function GET(
    request: NextRequest,
    { params }: { params: { messageId: string } }
) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    // We need to await params in Next.js 15+ if widely used, but for now standard access.
    // Safely awaiting if it's a promise (standard in newer Next.js versions is params as Promise)
    const { messageId } = await params;
    const folderId = request.nextUrl.searchParams.get('folderId') || undefined;

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const content = await getZohoEmailContent(user.id, messageId, folderId);
        return NextResponse.json({ content });
    } catch (error: any) {
        console.error('Error fetching email content:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
