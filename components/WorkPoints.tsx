'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, GripVertical, Check, Trash2, Image as ImageIcon, Pencil } from 'lucide-react'
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
  images: string[] | null
  display_order: number
  created_at: string
}

const EMPLOYEES = ['Arun', 'Allish', 'Nirjara'] as const

export default function WorkPoints() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Arun' | 'Allish' | 'Nirjara'>('All')

  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '' as '' | 'Arun' | 'Allish' | 'Nirjara',
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true)
      
      // Upload to Cloudinary via API
      const formData = new FormData()
      formData.append('files', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload image')
      }
      
      const data = await response.json()
      return data.urls[0] || null
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      alert('Please select image files only')
      return
    }

    const uploadPromises = imageFiles.map(file => uploadImage(file))
    const urls = await Promise.all(uploadPromises)
    const validUrls = urls.filter((url): url is string => url !== null)

    setUploadedImages([...uploadedImages, ...validUrls])
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      e.preventDefault()
      await handleImageUpload(files)
    }
  }

  const handleDragDropImage = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      await handleImageUpload(files)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleImageUpload(files)
    }
  }

  const removeUploadedImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
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
            images: uploadedImages.length > 0 ? uploadedImages : null,
            display_order: maxOrder + 1,
            completed: false,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setTasks([...tasks, data])
      setNewTask({ title: '', description: '', assigned_to: '' })
      setUploadedImages([])
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Failed to add task')
    }
  }

  const handleOpenEditDialog = (task: Task) => {
    setEditingTask(task)
    setNewTask({
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
    })
    setUploadedImages(task.images || [])
    setIsEditDialogOpen(true)
  }

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingTask || !newTask.title.trim()) return

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: newTask.title,
          description: newTask.description || null,
          assigned_to: newTask.assigned_to || null,
          images: uploadedImages.length > 0 ? uploadedImages : null,
        })
        .eq('id', editingTask.id)

      if (error) throw error

      // Update local state
      setTasks(tasks.map(t => 
        t.id === editingTask.id 
          ? { 
              ...t, 
              title: newTask.title, 
              description: newTask.description || null, 
              assigned_to: newTask.assigned_to || null,
              images: uploadedImages.length > 0 ? uploadedImages : null
            }
          : t
      ))

      setNewTask({ title: '', description: '', assigned_to: '' })
      setUploadedImages([])
      setEditingTask(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task')
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

  // Filter tasks based on selected employee
  const filteredTasks = selectedFilter === 'All' 
    ? tasks 
    : tasks.filter(t => t.assigned_to === selectedFilter)

  const activeTasks = filteredTasks.filter(t => !t.completed)
  const completedTasks = filteredTasks.filter(t => t.completed)

  // Get task counts per employee
  const getEmployeeTaskCount = (employee: 'Arun' | 'Allish' | 'Nirjara') => {
    return tasks.filter(t => t.assigned_to === employee && !t.completed).length
  }

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

              <div>
                <label className="block text-sm font-medium mb-2">
                  Images (Optional)
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onPaste={handlePaste}
                  onDrop={handleDragDropImage}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('task-image-upload')?.click()}
                >
                  <input
                    id="task-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <ImageIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1 font-medium">
                    Click to upload, drag & drop, or paste images
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: JPG, PNG, GIF, WEBP
                  </p>
                </div>

                {isUploading && (
                  <p className="text-sm text-blue-600 mt-2">Uploading images...</p>
                )}

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeUploadedImage(index)
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and save changes
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTask} className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Images (Optional)
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onPaste={handlePaste}
                onDrop={handleDragDropImage}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('edit-task-image-upload')?.click()}
              >
                <input
                  id="edit-task-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <ImageIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1 font-medium">
                  Click to upload, drag & drop, or paste images
                </p>
                <p className="text-xs text-gray-500">
                  Supports: JPG, PNG, GIF, WEBP
                </p>
              </div>

              {isUploading && (
                <p className="text-sm text-blue-600 mt-2">Uploading images...</p>
              )}

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeUploadedImage(index)
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingTask(null)
                  setNewTask({ title: '', description: '', assigned_to: '' })
                  setUploadedImages([])
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employee Filter Tags */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={selectedFilter === 'All' ? 'default' : 'outline'}
          onClick={() => setSelectedFilter('All')}
          className="rounded-full"
        >
          All Tasks ({tasks.filter(t => !t.completed).length})
        </Button>
        <Button
          variant={selectedFilter === 'Arun' ? 'default' : 'outline'}
          onClick={() => setSelectedFilter('Arun')}
          className={`rounded-full ${
            selectedFilter === 'Arun' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'border-blue-300 text-blue-700 hover:bg-blue-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
          Arun ({getEmployeeTaskCount('Arun')})
        </Button>
        <Button
          variant={selectedFilter === 'Allish' ? 'default' : 'outline'}
          onClick={() => setSelectedFilter('Allish')}
          className={`rounded-full ${
            selectedFilter === 'Allish' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'border-green-300 text-green-700 hover:bg-green-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
          Allish ({getEmployeeTaskCount('Allish')})
        </Button>
        <Button
          variant={selectedFilter === 'Nirjara' ? 'default' : 'outline'}
          onClick={() => setSelectedFilter('Nirjara')}
          className={`rounded-full ${
            selectedFilter === 'Nirjara' 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'border-purple-300 text-purple-700 hover:bg-purple-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-600 mr-2"></span>
          Nirjara ({getEmployeeTaskCount('Nirjara')})
        </Button>
      </div>

      {/* Active Tasks */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {selectedFilter === 'All' ? 'Active Tasks' : `${selectedFilter}'s Active Tasks`} ({activeTasks.length})
        </h2>
        <div className="space-y-3">
          {activeTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                {selectedFilter === 'All' 
                  ? 'No active tasks. Click "Add Task" to create one.' 
                  : `No active tasks for ${selectedFilter}.`
                }
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
                      {task.images && task.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {task.images.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Task image ${index + 1}`}
                              className="w-full h-24 object-cover rounded border hover:opacity-75 transition-opacity cursor-pointer"
                              onClick={() => window.open(url, '_blank')}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditDialog(task)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
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
            {selectedFilter === 'All' ? 'Completed Tasks' : `${selectedFilter}'s Completed Tasks`} ({completedTasks.length})
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
                      {task.images && task.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {task.images.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Task image ${index + 1}`}
                              className="w-full h-24 object-cover rounded border opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => window.open(url, '_blank')}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditDialog(task)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
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
