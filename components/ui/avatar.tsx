import React from 'react'

interface AvatarProps {
    name: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
    // Extract initials from name
    const getInitials = (name: string): string => {
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    // Get color based on first letter (A-Z maps to 0-6 repeating)
    const getColorClass = (name: string): string => {
        const firstChar = name.charAt(0).toUpperCase()
        const colorIndex = (firstChar.charCodeAt(0) - 65) % 7
        return `avatar-color-${colorIndex}`
    }

    const initials = getInitials(name)
    const colorClass = getColorClass(name)
    const sizeClass = `avatar-${size}`

    return (
        <div className={`avatar ${sizeClass} ${colorClass} ${className}`}>
            {initials}
        </div>
    )
}
