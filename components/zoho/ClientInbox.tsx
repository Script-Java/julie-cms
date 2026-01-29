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
    folderId: string;
    // Add other fields from Zoho API response as needed
}

import { QuickReply } from './QuickReply';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export function ClientInbox({ clientEmail, clientId }: { clientEmail: string; clientId: string }) {
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [emailContent, setEmailContent] = useState<string>('');
    const [loadingContent, setLoadingContent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emails, setEmails] = useState<Email[]>([]);
    const [showQuickReply, setShowQuickReply] = useState(false);

    const fetchEmails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/zoho/mail?email=${encodeURIComponent(clientEmail)}`);
            if (!res.ok) {
                const err = await res.json();
                console.error('[ClientInbox] Fetch error details:', err);
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

    const handleEmailClick = async (email: Email) => {
        setSelectedEmail(email);
        setLoadingContent(true);
        try {
            const res = await fetch(`/api/zoho/mail/${email.messageId}?folderId=${email.folderId}`);
            if (res.ok) {
                const data = await res.json();
                setEmailContent(data.content?.content || 'No content available.');
            } else {
                setEmailContent('Failed to load email content.');
            }
        } catch (e) {
            setEmailContent('Error loading content.');
        } finally {
            setLoadingContent(false);
        }
    };

    return (
        <>
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
                                    emails.map((email) => {
                                        const dateStr = email.sentDateInGMT;
                                        let displayDate = 'Invalid Date';
                                        try {
                                            const date = new Date(Number(dateStr) || dateStr);
                                            if (!isNaN(date.getTime())) {
                                                displayDate = date.toLocaleDateString();
                                            }
                                        } catch (e) { }

                                        return (
                                            <div
                                                key={email.messageId}
                                                onClick={() => handleEmailClick(email)}
                                                className="p-4 rounded-lg bg-zinc-900/50 border border-white/5 hover:border-[#00E676]/30 transition-colors group cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-white group-hover:text-[#00E676] transition-colors line-clamp-1">
                                                        {email.subject || '(No Subject)'}
                                                    </h4>
                                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                        {displayDate}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                                    {email.summary}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="inactive" className="bg-transparent border-white/10 text-xs text-gray-500">
                                                        {email.fromAddress.includes(clientEmail) ? 'Received' : 'Sent'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Email Detail Modal */}
            <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
                <DialogContent className="max-w-2xl bg-[#151515] border-white/10 text-white max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedEmail?.subject || '(No Subject)'}</DialogTitle>
                        <DialogDescription className="text-gray-400 flex items-center gap-2 mt-1">
                            <span>From: {selectedEmail?.fromAddress}</span>
                            <span>•</span>
                            <span>{new Date(Number(selectedEmail?.sentDateInGMT)).toLocaleString()}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        {loadingContent ? (
                            <div className="flex justify-center py-8">
                                <RefreshCw className="w-6 h-6 animate-spin text-[#00E676]" />
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none text-sm bg-white/5 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: emailContent }} />
                        )}

                        <div className="flex justify-end pt-4 border-t border-white/10">
                            <Button onClick={() => {
                                setSelectedEmail(null);
                                setShowQuickReply(true);
                            }}>
                                <Reply className="w-4 h-4 mr-2" /> Reply
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {showQuickReply && (
                <QuickReply
                    to={clientEmail}
                    clientId={clientId}
                    subject={selectedEmail ? `Re: ${selectedEmail.subject}` : undefined}
                    onClose={() => setShowQuickReply(false)}
                    onSent={() => {
                        fetchEmails();
                        setSelectedEmail(null);
                    }}
                />
            )}
        </>
    );
}
