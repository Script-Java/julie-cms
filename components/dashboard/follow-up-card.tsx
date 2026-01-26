import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Users } from 'lucide-react'

interface Client {
    id: string
    name: string
    company: string
    last_contacted_at: string | null
}

interface FollowUpCardProps {
    clients: Client[] | null
}

export function FollowUpCard({ clients }: FollowUpCardProps) {
    return (
        <Card className="border-white/10 bg-[#2d2342] lg:col-span-1 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center">
                    <Users className="w-4 h-4 mr-2 text-white/70" />
                    Follow-ups Due
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!clients || clients.length === 0 ? (
                    <p className="text-sm text-gray-400">All caught up!</p>
                ) : (
                    <ul className="space-y-2">
                        {clients.map(client => (
                            <li
                                key={client.id}
                                className="text-sm flex justify-between items-center bg-[#151515] p-3 rounded-md border border-white/10 shadow-sm"
                            >
                                <div className="flex flex-col">
                                    <Link
                                        href={`/clients/${client.id}`}
                                        className="font-medium text-white hover:text-[#d8b4fe]" // Light Purple Hover
                                    >
                                        {client.name}
                                    </Link>
                                    <span className="text-xs text-gray-400">
                                        {client.company}
                                    </span>
                                </div>
                                <div>
                                    {client.last_contacted_at ? (
                                        <span className="text-xs text-gray-300 font-semibold">
                                            {Math.floor((new Date().getTime() - new Date(client.last_contacted_at).getTime()) / (1000 * 3600 * 24))}d ago
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold text-[#D4AF37]">Never</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
