'use client'

import { Logo } from '@/components/logo'
import { OAuthButton } from '@/components/oauth-button'
import { CheckCircle2 } from 'lucide-react'

interface LoginCardProps {
    onLogin: (provider: 'google') => Promise<void>
    isLoading: boolean
}

export function LoginCard({ onLogin, isLoading }: LoginCardProps) {
    return (
        <div className="w-full max-w-sm space-y-8 rounded-2xl bg-[#151515] px-8 py-12 shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/20 ring-1 ring-black/20">
            <div className="flex flex-col items-center text-center">
                <div className="mb-6">
                    <Logo size={80} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                    Welcome back
                </h2>
                <p className="mt-2 text-sm text-gray-400 max-w-[280px]">
                    Sign in to access your client follow-up dashboard and manage your workflow.
                </p>
            </div>

            <div className="mt-8 space-y-4">
                <OAuthButton
                    provider="google"
                    onClick={() => onLogin('google')}
                    isLoading={isLoading}
                />
            </div>

            <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-gray-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>Secure authentication powered by Supabase</span>
            </div>
        </div>
    )
}
