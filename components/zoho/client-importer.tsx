'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ZohoClientImporter() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
    const router = useRouter();

    const fetchContacts = async () => {
        setLoading(true);
        setContacts([]);
        try {
            const res = await fetch('/api/zoho/contacts/sync', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to fetch contacts');
            const data = await res.json();
            setContacts(data.contacts || []);
            // Select all by default
            setSelectedEmails(new Set(data.contacts.map((c: any) => c.email)));
        } catch (error) {
            console.error(error);
            alert('Error fetching contacts from Zoho');
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchContacts();
    };

    const toggleSelection = (email: string) => {
        const next = new Set(selectedEmails);
        if (next.has(email)) {
            next.delete(email);
        } else {
            next.add(email);
        }
        setSelectedEmails(next);
    };

    const handleImport = async () => {
        if (selectedEmails.size === 0) return;
        setImporting(true);
        try {
            const clientsToImport = contacts.filter(c => selectedEmails.has(c.email));
            const res = await fetch('/api/clients/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients: clientsToImport })
            });

            if (!res.ok) throw new Error('Failed to import clients');

            setIsOpen(false);
            router.refresh(); // Refresh the page to show new clients
            alert(`Successfully imported ${clientsToImport.length} clients!`);
        } catch (error) {
            console.error(error);
            alert('Error importing clients');
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) {
        return (
            <Button onClick={handleOpen} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Import from Zoho
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Import Contacts from Zoho</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-auto p-4 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p>Scanning Sent Emails...</p>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p>No new unique contacts found in your sent items.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center pb-2">
                                <span className="text-sm text-gray-400">{contacts.length} contacts found</span>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setSelectedEmails(new Set(selectedEmails.size === contacts.length ? [] : contacts.map(c => c.email)))}
                                >
                                    {selectedEmails.size === contacts.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            {contacts.map((contact) => (
                                <div
                                    key={contact.email}
                                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer border transition-colors ${selectedEmails.has(contact.email)
                                            ? 'bg-[#00E676]/10 border-[#00E676]/50'
                                            : 'bg-[#222] border-transparent hover:bg-[#2a2a2a]'
                                        }`}
                                    onClick={() => toggleSelection(contact.email)}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedEmails.has(contact.email) ? 'bg-[#00E676] border-[#00E676]' : 'border-gray-500'
                                        }`}>
                                        {selectedEmails.has(contact.email) && <Check className="w-3.5 h-3.5 text-black" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">{contact.name || 'Unknown Name'}</div>
                                        <div className="text-sm text-gray-400">{contact.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-[#1a1a1a]">
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={importing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={importing || selectedEmails.size === 0}
                        className="bg-[#00E676] text-black hover:bg-[#00c853]"
                    >
                        {importing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            `Import ${selectedEmails.size} Contacts`
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
