import React from 'react'

interface BadgeProps {
    children: React.ReactNode
    variant?: 'active' | 'pending' | 'inactive' | 'lead' | 'closed'
    className?: string
}

export function Badge({ children, variant = 'inactive', className = '' }: BadgeProps) {
    // Map status variants to badge classes
    const getVariantClass = () => {
        switch (variant) {
            case 'active':
                return 'badge-active'
            case 'pending':
                return 'badge-pending'
            case 'lead':
                return 'badge-lead'
            case 'inactive':
            case 'closed':
                return 'badge-inactive'
            default:
                return 'badge-inactive'
        }
    }

    return (
        <span className={`badge ${getVariantClass()} ${className}`}>
            {children}
        </span>
    )
}
