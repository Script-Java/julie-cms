"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
    <div className="relative flex items-center">
        <input
            type="checkbox"
            className={cn(
                "peer h-4 w-4 shrink-0 rounded-sm border border-white/20 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[#151515] checked:bg-[#00E676] checked:border-[#00E676]",
                className
            )}
            ref={ref}
            {...props}
        />
        <Check className="h-3 w-3 text-black absolute left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" />
    </div>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
