import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <div className="p-6 bg-[#151515] rounded-xl border border-zinc-800">
                    <h2 className="text-xl font-semibold mb-4 text-white">Profile</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Email</label>
                            <div className="mt-1 text-white">{user.email}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">User ID</label>
                            <div className="mt-1 text-white font-mono text-sm">{user.id}</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#151515] rounded-xl border border-zinc-800">
                    <h2 className="text-xl font-semibold mb-4 text-white">App Preferences</h2>
                    <div className="space-y-4">
                        <Link href="/settings/integrations" className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 transition-colors group">
                            <div>
                                <div className="font-medium text-white group-hover:text-[#00E676] transition-colors">Integrations</div>
                                <div className="text-sm text-gray-500">Connect third-party apps like Zoho</div>
                            </div>
                            <div className="text-zinc-400">→</div>
                        </Link>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div>
                                <div className="font-medium text-white">Theme</div>
                                <div className="text-sm text-gray-500">Customize your interface appearance</div>
                            </div>
                            <div className="text-xs text-zinc-500 font-medium px-2 py-1 rounded bg-zinc-800">Coming Soon</div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div>
                                <div className="font-medium text-white">Notifications</div>
                                <div className="text-sm text-gray-500">Manage your email alerts</div>
                            </div>
                            <div className="text-xs text-zinc-500 font-medium px-2 py-1 rounded bg-zinc-800">Coming Soon</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
