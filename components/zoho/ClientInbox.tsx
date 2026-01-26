'use client';

import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Reply, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Email {
    messageId: string;
    subject: string;
    summary: string;
    fromAddress: string;
    sentDateInGMT: string;
    status: string;
    // Add other fields from Zoho API response as needed
}

import { QuickReply } from './QuickReply';

export function ClientInbox({ clientEmail }: { clientEmail: string }) {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showQuickReply, setShowQuickReply] = useState(false);

    const fetchEmails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/zoho/mail?email=${encodeURIComponent(clientEmail)}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to fetch emails');
            }
            const data = await res.json();
            setEmails(data.emails);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientEmail) {
            fetchEmails();
        }
    }, [clientEmail]);

    return (
        <Card className="bg-[#151515] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-[#00E676]" />
                        Inbox
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Recent communication with {clientEmail}
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowQuickReply(true)}>
                        <Reply className="w-4 h-4 mr-2" /> New Message
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fetchEmails} disabled={loading} className="text-gray-400 hover:text-white">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="text-red-400 text-sm p-4 bg-red-900/10 rounded border border-red-900/20">
                        Error: {error}
                    </div>
                ) : (
                    <div className="h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                        <div className="space-y-4">
                            {emails.length === 0 && !loading ? (
                                <div className="text-center text-gray-500 py-8">
                                    No emails found.
                                </div>
                            ) : (
                                emails.map((email) => (
                                    <div key={email.messageId} className="p-4 rounded-lg bg-zinc-900/50 border border-white/5 hover:border-[#00E676]/30 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-white group-hover:text-[#00E676] transition-colors line-clamp-1">
                                                {email.subject || '(No Subject)'}
                                            </h4>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                {new Date(email.sentDateInGMT).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                            {email.summary}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="inactive" className="bg-transparent border-white/10 text-xs text-gray-500">
                                                {email.fromAddress.includes(clientEmail) ? 'Received' : 'Sent'}
                                            </Badge>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400 hover:text-[#00E676]" onClick={() => setShowQuickReply(true)}>
                                                <Reply className="w-3 h-3 mr-1" /> Quick Reply
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
            {showQuickReply && (
                <QuickReply
                    to={clientEmail}
                    onClose={() => setShowQuickReply(false)}
                    onSent={() => {
                        fetchEmails(); // Refresh list after sending
                    }}
                />
            )}
        </Card>
    );
}
