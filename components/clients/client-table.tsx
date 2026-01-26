'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { deleteClients } from '@/app/clients/actions';

interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    status: string;
    created_at: string;
}

interface ClientTableProps {
    clients: Client[];
}

export function ClientTable({ clients }: ClientTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(clients.map((c) => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) return;

        setIsDeleting(true);
        try {
            const result = await deleteClients(Array.from(selectedIds));
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                setSelectedIds(new Set());
                router.refresh();
            }
        } catch (error) {
            alert('An unexpected error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 px-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm text-red-200">
                        {selectedIds.size} contact{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete Selected'}
                    </Button>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                            <Checkbox
                                checked={clients.length > 0 && selectedIds.size === clients.length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone number</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date created</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                                No clients found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        clients.map((client) => (
                            <TableRow key={client.id} data-state={selectedIds.has(client.id) && "selected"}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.has(client.id)}
                                        onChange={(e) => handleSelectOne(client.id, e.target.checked)}
                                        aria-label={`Select ${client.name}`}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar name={client.name} size="md" />
                                        <div>
                                            <Link
                                                href={`/clients/${client.id}`}
                                                className="font-medium text-white hover:text-[#00E676]"
                                            >
                                                {client.name}
                                            </Link>
                                            {client.email && (
                                                <div className="text-sm text-gray-400">{client.email}</div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-[#00E676]">
                                        {client.phone || '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-gray-300">
                                        {client.company || '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={client.status as any}>
                                        {client.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-gray-400">
                                        {client.created_at
                                            ? new Date(client.created_at).toLocaleDateString('en-US', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })
                                            : '-'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {client.created_at
                                            ? new Date(client.created_at).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false,
                                            })
                                            : ''}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
