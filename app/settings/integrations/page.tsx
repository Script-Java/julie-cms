'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function IntegrationsPage() {
    const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // Check for URL params
        const err = searchParams.get('error');
        const success = searchParams.get('status');

        if (err) {
            setError(err);
        }

        checkStatus();
    }, [searchParams]);

    const checkStatus = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('user_id', user.id)
                .eq('provider', 'zoho')
                .single();

            if (data) {
                setStatus('connected');
            } else {
                setStatus('disconnected');
            }
        }
    };

    const handleConnect = () => {
        const clientId = process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            setError('Missing configuration. Please contact support.');
            return;
        }

        const scope = 'ZohoMail.messages.ALL,ZohoMail.folders.READ,ZohoMail.accounts.READ,ZohoCalendar.event.ALL,ZohoCalendar.calendar.READ';
        const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&access_type=offline&prompt=consent&redirect_uri=${encodeURIComponent(redirectUri)}`;

        window.location.href = authUrl;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Error: {error}</span>
                </div>
            )}

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            Zoho Workspace
                            {status === 'connected' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        </CardTitle>
                        <CardDescription>
                            Connect your Zoho Mail and Calendar to enable email sending and event management directly from the dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {status === 'loading' ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <RefreshCw className="w-4 h-4 animate-spin" /> Checking status...
                            </div>
                        ) : status === 'connected' ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-500/10 text-green-600 rounded-md border border-green-500/20 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Connected successfully
                                </div>
                                <Button variant="outline" onClick={handleConnect}>
                                    Reconnect / Update Permissions
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={handleConnect} className="bg-[#00E676] hover:bg-[#00c853] text-black">
                                Connect Zoho Workspace
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
