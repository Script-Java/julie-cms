'use client'

import { LogOut } from 'lucide-react'

interface SignOutButtonProps {
    onSignOut: () => void
}

export function SignOutButton({ onSignOut }: SignOutButtonProps) {
    return (
        <button
            onClick={onSignOut}
            type="button"
            className="sidebar-nav-item w-full text-left"
        >
            <LogOut />
            Sign out
        </button>
    )
}
