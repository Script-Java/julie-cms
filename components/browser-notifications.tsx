'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export function BrowserNotifications() {
    useEffect(() => {
        // Request permission immediately on mount
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission()
            }
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return

        const supabase = createClient()

        const checkTasks = async () => {
            if (Notification.permission !== 'granted') return

            const now = new Date()
            // Check tasks due today
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

            // Active tasks due today
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .lte('due_at', endOfDay)
                .neq('status', 'completed')
                .neq('status', 'done')

            if (!tasks || tasks.length === 0) return

            // Load notified history
            const notified = JSON.parse(localStorage.getItem('julie_notified_tasks') || '[]')
            const newNotified = [...notified]
            let changed = false

            tasks.forEach((task: any) => {
                if (newNotified.includes(task.id)) return

                const dueTime = new Date(task.due_at).getTime()
                const timeDiff = dueTime - now.getTime()

                // Criteria: 
                // 1. Due within the next 60 seconds (upcoming)
                // 2. Or due in the last 5 minutes (recently passed)
                if (timeDiff <= 60 * 1000 && timeDiff > -5 * 60 * 1000) {
                    try {
                        new Notification(`Task Due: ${task.title}`, {
                            body: `This task is due now!`,
                            tag: task.id, // prevents duplicate notifications for same ID if supported
                        })
                    } catch (e) {
                        console.error("Notification failed", e)
                    }
                    newNotified.push(task.id)
                    changed = true
                }
            })

            if (changed) {
                localStorage.setItem('julie_notified_tasks', JSON.stringify(newNotified))
            }
        }

        // Initial check
        checkTasks()
        // Poll every 30 seconds
        const interval = setInterval(checkTasks, 30 * 1000)
        return () => clearInterval(interval)
    }, [])

    return null
}
