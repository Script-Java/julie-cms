import Image from 'next/image'
import { cn } from '@/lib/utils'
import logo from '@/app/assets/logo/logo-cropped.png'

interface LogoProps {
    size?: number
    className?: string
}

export function Logo({ size = 48, className }: LogoProps) {
    return (
        <Image
            src={logo}
            alt="Julie CMS Logo"
            style={{ height: size, width: 'auto' }}
            className={cn("object-contain", className)}
        />
    )
}
