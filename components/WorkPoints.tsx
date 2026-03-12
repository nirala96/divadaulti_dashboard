'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, GripVertical, Check, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: 'Arun' | 'Allish' | 'Nirjara' | null
  completed: boolean
  completed_at: string | null
  display_order: number
  created_at: string
}

const EMPLOYEES = ['Arun', 'Allish', 'Nirjara'] as const

export default function WorkPoints() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '' as '' | 'Arun' | 'Allish' | 'Nirjara',
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTask.title.trim()) return

    try {
      // Get the max display_order
      const maxOrder = tasks.length > 0 
        ? Math.max(...tasks.map(t => t.display_order || 0))
        : -1

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTask.title,
            description: newTask.description || null,
            assigned_to: newTask.assigned_to || null,
            display_order: maxOrder + 1,
            completed: false,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setTasks([...tasks, data])
      setNewTask({ title: '', description: '', assigned_to: '' })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Failed to add task')
    }
  }

  const handleToggleComplete = async (task: Task) => {
    try {
      const newCompleted = !task.completed

      const { error } = await supabase
        .from('tasks')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', task.id)

      if (error) throw error

      setTasks(tasks.map(t => 
        t.id === task.id 
          ? { ...t, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : t
      ))
    } catch (error) {
      console.error('Error toggling task completion:', error)
      alert('Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task')
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault()

    if (!draggedTaskId || draggedTaskId === dropTargetId) {
      setDraggedTaskId(null)
      return
    }

    // Reorder tasks in UI
    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId)
    const targetIndex = tasks.findIndex(t => t.id === dropTargetId)

    const reorderedTasks = [...tasks]
    const [draggedTask] = reorderedTasks.splice(draggedIndex, 1)
    reorderedTasks.splice(targetIndex, 0, draggedTask)

    // Update UI immediately
    setTasks(reorderedTasks)
    setDraggedTaskId(null)

    // Save to database in background
    try {
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        display_order: index,
      }))

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      }

      console.log('✅ Task order saved')
    } catch (error) {
      console.error('Error saving task order:', error)
      // Revert on error
      fetchTasks()
    }
  }

  const getEmployeeColor = (employee: string | null) => {
    switch (employee) {
      case 'Arun': return 'bg-blue-100 text-blue-800'
      case 'Allish': return 'bg-green-100 text-green-800'
      case 'Nirjara': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="p-8">Loading work points...</div>
  }

  const activeTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Work Points</h1>
          <p className="text-gray-600 mt-1">
            Manage tasks and track completion
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Create a new task and assign it to a team member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Task Title *
                </label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Assign To
                </label>
                <Select
                  value={newTask.assigned_to}
                  onValueChange={(value) => 
                    setNewTask({ ...newTask, assigned_to: value as 'Arun' | 'Allish' | 'Nirjara' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEES.map(emp => (
                      <SelectItem key={emp} value={emp}>
                        {emp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Task</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Tasks */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Active Tasks ({activeTasks.length})
        </h2>
        <div className="space-y-3">
          {activeTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No active tasks. Click "Add Task" to create one.
              </CardContent>
            </Card>
          ) : (
            activeTasks.map((task) => (
              <Card
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, task.id)}
                className={`cursor-move transition-all hover:shadow-md ${
                  draggedTaskId === task.id ? 'opacity-50 border-blue-500 border-2' : ''
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {task.description}
                        </p>
                      )}
                      {task.assigned_to && (
                        <div className="mt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEmployeeColor(task.assigned_to)}`}>
                            {task.assigned_to}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleComplete(task)}
                        className="bg-green-50 hover:bg-green-100 text-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Work Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-600">
            Completed Tasks ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <Card key={task.id} className="bg-gray-50">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg line-through text-gray-500">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-400 text-sm mt-1 line-through">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {task.assigned_to && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEmployeeColor(task.assigned_to)}`}>
                            {task.assigned_to}
                          </span>
                        )}
                        {task.completed_at && (
                          <span className="text-xs text-gray-500">
                            Completed {new Date(task.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleComplete(task)}
                        className="text-gray-600"
                      >
                        Undo
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
