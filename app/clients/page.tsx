import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Search, Filter } from 'lucide-react'
import { redirect } from 'next/navigation'

import { ClientTable } from '@/components/clients/client-table'
import { ZohoClientImporter } from '@/components/zoho/client-importer'

export default async function ClientsPage({
    searchParams,
}: {
    searchParams: { q?: string; status?: string }
}) {
    const supabase = await createClient()
    const { q, status } = await searchParams

    let query = supabase
        .from('clients')
        .select('*')
        .order('last_contacted_at', { ascending: true, nullsFirst: true })

    if (q) {
        query = query.ilike('name', `%${q}%`)
    }

    if (status) {
        query = query.eq('status', status)
    }

    const { data: clients } = await query

    async function search(formData: FormData) {
        'use server'
        const q = formData.get('q')
        redirect(`/clients?q=${q || ''}`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-white">Contacts</h1>
                <div className="flex gap-3">
                    <ZohoClientImporter />
                    <Link href="/clients/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Contact
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-white/10">
                <button className="pb-3 border-b-2 border-[#00E676] text-sm font-semibold text-white">
                    Contacts ({clients?.length || 0})
                </button>
                <button className="pb-3 border-b-2 border-transparent text-sm font-medium text-gray-400 hover:text-white">
                    Companies (0)
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 items-center">
                <form action={search} className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            name="q"
                            placeholder="Search by Name, Email, or Phone number"
                            className="pl-9"
                            defaultValue={q}
                        />
                    </div>
                </form>
                <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Table */}
            <ClientTable clients={clients || []} />

            {/* Pagination */}
            {clients && clients.length > 0 && (
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-gray-300">
                        Showing: 1-{clients.length} of {clients.length}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>1</Button>
                        <Button variant="outline" size="sm">2</Button>
                        <Button variant="outline" size="sm">›</Button>
                        <select className="border border-white/10 bg-[#151515] text-white rounded-md px-2 py-1 text-sm">
                            <option>10 / page</option>
                            <option>25 / page</option>
                            <option>50 / page</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    )
}
