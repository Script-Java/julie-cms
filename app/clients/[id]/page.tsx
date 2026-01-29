import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Phone, Mail, Clock, CheckCircle, Building2 } from 'lucide-react'
import { ClientInbox } from '@/components/zoho/ClientInbox'

import { logContact, snooze } from '@/app/clients/actions'

export default async function ClientDetailPage({
    params,
}: {
    params: { id: string }
}) {
    const supabase = await createClient()
    const cid = (await params).id

    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', cid)
        .single()

    if (!client) notFound()

    const { data: touchpoints } = await supabase
        .from('touchpoints')
        .select('*')
        .eq('client_id', cid)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{client.name}</h1>
                    <div className="text-gray-300 flex items-center gap-4 mt-2">
                        {client.company && (
                            <span className="flex items-center gap-2 font-medium">
                                <Building2 className="w-4 h-4 text-[#00E676]" />
                                {client.company}
                            </span>
                        )}
                        <span className="bg-gray-100/10 px-2 py-0.5 rounded text-sm capitalize text-white border border-white/10">{client.status}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <form action={snooze}>
                        <input type="hidden" name="clientId" value={cid} />
                        <Button variant="outline" type="submit">
                            <Clock className="w-4 h-4 mr-2" /> Snooze Follow-up
                        </Button>
                    </form>
                    {/* Edit Button */}
                    <Link href={`/clients/${cid}/edit`}>
                        <Button variant="outline">Edit Profile</Button>
                    </Link>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Info Column */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-[#151515] p-4 rounded-lg border border-white/10 shadow-sm space-y-4">
                        <h2 className="font-semibold text-white border-b border-white/10 pb-2">Contact Info</h2>
                        <div className="space-y-3 text-sm">
                            {client.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <a href={`mailto:${client.email}`} className="text-[#00E676] hover:underline">{client.email}</a>
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <a href={`tel:${client.phone}`} className="text-[#00E676] hover:underline">{client.phone}</a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#151515] p-4 rounded-lg border border-white/10 shadow-sm space-y-4">
                        <h2 className="font-semibold text-white border-b border-white/10 pb-2">Follow-up</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Frequency:</span>
                                <span>Every {client.followup_frequency_days} days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Last Contact:</span>
                                <span>{client.last_contacted_at ? new Date(client.last_contacted_at).toLocaleDateString() : 'Never'}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="font-medium">Next Due:</span>
                                <span className={client.next_followup_at && new Date(client.next_followup_at) < new Date() ? "text-[#D4AF37] font-bold" : ""}>
                                    {client.next_followup_at ? new Date(client.next_followup_at).toLocaleDateString() : 'None'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Zoho Inbox */}
                    {client.email && (
                        <ClientInbox clientEmail={client.email} clientId={cid} />
                    )}

                    {/* Log Contact Form */}
                    <div className="bg-[#151515] p-4 rounded-lg border border-white/10 shadow-sm">
                        <h3 className="font-semibold mb-3">Log Interaction</h3>
                        <form action={logContact} className="flex flex-col gap-3">
                            <input type="hidden" name="clientId" value={cid} />
                            <div className="flex gap-2">
                                <select name="type" className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="note">
                                    <option value="call">Call</option>
                                    <option value="email">Email</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="text">Text</option>
                                    <option value="note">Note</option>
                                </select>
                                <Input name="summary" placeholder="Summary of conversation..." required className="flex-1" />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" size="sm">
                                    <CheckCircle className="w-4 h-4 mr-2" /> Log & Update Follow-up
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* History */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">History</h3>
                        <div className="space-y-4 relative border-l-2 border-gray-100 ml-3 pl-6 pb-4">
                            {touchpoints?.map((tp) => (
                                <div key={tp.id} className="relative">
                                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-gray-200 ring-4 ring-white" />
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                                        <span className="text-sm font-medium capitalize text-white">{tp.type}</span>
                                        <span className="text-xs text-gray-400">{new Date(tp.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 mt-1">{tp.summary}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
