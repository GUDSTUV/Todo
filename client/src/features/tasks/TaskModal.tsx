import { useState, useEffect } from 'react';
import { useTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks/useTasks';
import { useUIStore } from '../../store/uiStore';
import { Modal } from '../../components/ui/modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/textarea/Textarea';
import { Select } from '../../components/ui/select/Select';
import { Button } from '../../components/ui/button/Button';
import { Checkbox } from '../../components/ui/checkbox/Checkbox';
import { Badge } from '../../components/ui/badge/Badge';
import { Spinner } from '../../components/ui/spinner/Spinner';
import { CommentsSection } from './CommentsSection';
import type { UpdateTaskData } from '../../api/tasks/tasks';

export const TaskModal = () => {
  const isOpen = useUIStore((state) => state.isTaskModalOpen);
  const selectedTaskId = useUIStore((state) => state.selectedTaskId);
  const closeTaskModal = useUIStore((state) => state.closeTaskModal);

  const { data, isLoading } = useTask(selectedTaskId || '');
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();

  const task = data?.data;

  const [formData, setFormData] = useState<UpdateTaskData>({});
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        tags: task.tags,
        subtasks: task.subtasks,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
        reminderDate: task.reminderDate ? new Date(task.reminderDate).toISOString().slice(0, 16) : '',
      });
    }
  }, [task]);

  const handleUpdate = () => {
    if (!selectedTaskId) return;

    const updates: UpdateTaskData = {};
    if (formData.title && formData.title !== task?.title) updates.title = formData.title;
    if (formData.description !== task?.description) updates.description = formData.description;
    if (formData.status !== task?.status) updates.status = formData.status;
    if (formData.priority !== task?.priority) updates.priority = formData.priority;
    if (JSON.stringify(formData.tags) !== JSON.stringify(task?.tags)) updates.tags = formData.tags;
    if (JSON.stringify(formData.subtasks) !== JSON.stringify(task?.subtasks))
      updates.subtasks = formData.subtasks;
    if (formData.dueDate !== task?.dueDate) updates.dueDate = formData.dueDate;
    if (formData.reminderDate !== task?.reminderDate) updates.reminderDate = formData.reminderDate;

    if (Object.keys(updates).length > 0) {
      updateTask({ id: selectedTaskId, data: updates });
    }
  };

  const handleDelete = () => {
    if (!selectedTaskId) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(selectedTaskId, {
        onSuccess: () => {
          closeTaskModal();
        },
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag),
    });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setFormData({
        ...formData,
        subtasks: [...(formData.subtasks || []), { title: newSubtask.trim(), done: false }],
      });
      setNewSubtask('');
    }
  };

  const handleToggleSubtask = (index: number) => {
    const updatedSubtasks = [...(formData.subtasks || [])];
    updatedSubtasks[index].done = !updatedSubtasks[index].done;
    setFormData({ ...formData, subtasks: updatedSubtasks });
  };

  const handleRemoveSubtask = (index: number) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks?.filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={closeTaskModal} title="Task Details" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : task ? (
        <div className="space-y-6">
          <Input
            label="Title"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            onBlur={handleUpdate}
            required
          />

          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onBlur={handleUpdate}
            rows={4}
            placeholder="Add a description..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.status || 'todo'}
              onChange={(e) => {
                setFormData({ ...formData, status: e.target.value as 'todo' | 'in-progress' | 'done' });
                setTimeout(handleUpdate, 100);
              }}
              options={[
                { value: 'todo', label: 'To Do' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'done', label: 'Done' },
              ]}
            />

            <Select
              label="Priority"
              value={formData.priority || 'medium'}
              onChange={(e) => {
                setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' });
                setTimeout(handleUpdate, 100);
              }}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="datetime-local"
              value={formData.dueDate || ''}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              onBlur={handleUpdate}
            />
            <Input
              label="Reminder Date"
              type="datetime-local"
              value={formData.reminderDate || ''}
              onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
              onBlur={handleUpdate}
              className={formData.dueDate && formData.reminderDate && new Date(formData.reminderDate) > new Date(formData.dueDate) ? 'border-red-500' : ''}
              helperText={formData.dueDate && formData.reminderDate && new Date(formData.reminderDate) > new Date(formData.dueDate) ? 'Reminder should be before due date' : ''}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map((tag) => (
                <Badge key={tag} variant="primary">
                  #{tag}
                  <button
                    onClick={() => {
                      handleRemoveTag(tag);
                      setTimeout(handleUpdate, 100);
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                    setTimeout(handleUpdate, 100);
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => {
                  handleAddTag();
                  setTimeout(handleUpdate, 100);
                }}
                variant="secondary"
                className="whitespace-nowrap"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtasks</label>
            <div className="space-y-2 mb-2">
              {formData.subtasks?.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    checked={subtask.done}
                    onChange={() => {
                      handleToggleSubtask(index);
                      setTimeout(handleUpdate, 100);
                    }}
                  />
                  <span className={`flex-1 ${subtask.done ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => {
                      handleRemoveSubtask(index);
                      setTimeout(handleUpdate, 100);
                    }}
                    className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500"
                    aria-label={`Remove subtask ${subtask.title}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                    setTimeout(handleUpdate, 100);
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => {
                  handleAddSubtask();
                  setTimeout(handleUpdate, 100);
                }}
                variant="secondary"
                className="whitespace-nowrap"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          {selectedTaskId && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <CommentsSection taskId={selectedTaskId} />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting} fullWidth className="sm:w-auto">
              Delete Task
            </Button>
            <Button onClick={closeTaskModal} fullWidth className="sm:w-auto">Close</Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Task not found</p>
        </div>
      )}
    </Modal>
  );
};
