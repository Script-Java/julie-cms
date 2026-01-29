'use client';

import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { logContact } from '@/app/clients/actions';

interface QuickReplyProps {
    to: string;
    clientId: string; // Add clientId for logging
    subject?: string; // Add subject prop
    onClose: () => void;
    onSent: () => void;
}

export function QuickReply({ to, clientId, subject: initialSubject, onClose, onSent }: QuickReplyProps) {
    const [subject, setSubject] = useState(initialSubject || '');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!subject || !message) return;
        setSending(true);
        try {
            // 1. Send Email
            const res = await fetch('/api/zoho/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, message })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to send');
            }

            // 2. Log Interaction
            const formData = new FormData();
            formData.append('clientId', clientId);
            formData.append('type', 'email'); // Log as email
            formData.append('summary', `Sent email: ${subject}`);

            await logContact(formData);

            onSent();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(`Failed to send email: ${error.message}`);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#151515] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-900/50">
                    <h3 className="font-semibold text-white flex items-center">
                        <Send className="w-4 h-4 mr-2 text-[#00E676]" />
                        Quick Reply to {to}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Subject</label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Re: Follow up..."
                            className="bg-zinc-900/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#00E676]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            rows={6}
                            className="w-full rounded-md border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] resize-none"
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-white/5 bg-zinc-900/50 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
                    <Button onClick={handleSend} disabled={sending || !subject || !message} className="bg-[#00E676] text-black hover:bg-[#00C853]">
                        {sending ? 'Sending...' : 'Send Message'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
