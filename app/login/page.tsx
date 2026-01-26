'use client'

import { createClient } from '@/utils/supabase/client'
import { LoginCard } from '@/components/login/login-card'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
    const supabase = createClient()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (provider: 'google') => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) {
            console.error('Error logging in:', error.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] p-4">
            <LoginCard onLogin={handleLogin} isLoading={isLoading} />
        </div>
    )
}
