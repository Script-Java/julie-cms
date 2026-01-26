"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Circle } from "lucide-react"

interface Task {
    id: string
    title: string | null
    status: string | null
    priority: string | null
    due_at: string | null
    clients: {
        name: string | null
    } | null
}

interface TaskListProps {
    tasks: Task[]
    completeTaskAction: (formData: FormData) => Promise<void>
    deleteTasksAction: (ids: string[]) => Promise<void>
}

export function TaskList({ tasks, completeTaskAction, deleteTasksAction }: TaskListProps) {
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

    const toggleSelectAll = () => {
        if (selectedTasks.size === tasks.length) {
            setSelectedTasks(new Set())
        } else {
            setSelectedTasks(new Set(tasks.map(t => t.id)))
        }
    }

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedTasks)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedTasks(newSelected)
    }

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete ' + selectedTasks.size + ' tasks?')) {
            await deleteTasksAction(Array.from(selectedTasks))
            setSelectedTasks(new Set())
        }
    }

    return (
        <div className="bg-[#151515] rounded-lg border border-white/10 shadow-sm overflow-hidden">
            {tasks.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                    No open tasks.
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* Header with Select All */}
                    <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-white/5">
                        <Checkbox
                            checked={selectedTasks.size === tasks.length && tasks.length > 0}
                            onChange={toggleSelectAll}
                        />
                        <span className="text-sm font-medium text-gray-400">
                            {selectedTasks.size} selected
                        </span>
                        {selectedTasks.size > 0 && (
                            <div className="flex gap-2 ml-auto">
                                <Button variant="destructive" size="sm" onClick={handleDelete}>
                                    Delete Selected
                                </Button>
                            </div>
                        )}
                    </div>

                    <ul className="divide-y divide-white/5">
                        {tasks.map((task) => (
                            <li
                                key={task.id}
                                className={`p-4 flex items-center gap-4 group transition-colors ${selectedTasks.has(task.id) ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                                <Checkbox
                                    checked={selectedTasks.has(task.id)}
                                    onChange={() => toggleSelect(task.id)}
                                />

                                <form action={completeTaskAction}>
                                    <input type="hidden" name="id" value={task.id} />
                                    <button type="submit" className="text-gray-400 hover:text-[#00E676] transition-colors" title="Mark Complete">
                                        <Circle className="w-5 h-5" />
                                    </button>
                                </form>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/tasks/${task.id}`} className="font-medium text-white hover:text-[#00E676]">
                                            {task.title}
                                        </Link>
                                        {task.priority === 'high' && (
                                            <Badge variant="pending">High</Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-400 flex items-center gap-4 mt-1">
                                        {task.clients && (
                                            <span>For: {task.clients.name}</span>
                                        )}
                                        {task.due_at && (
                                            <span className={`flex items-center gap-1 ${new Date(task.due_at) < new Date() ? 'text-[#D4AF37] font-medium' : ''}`}>
                                                <Calendar className="w-3 h-3" />
                                                {new Date(task.due_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Link href={`/tasks/${task.id}`}>
                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">Edit</Button>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
