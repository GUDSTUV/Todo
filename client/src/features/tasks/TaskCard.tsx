import { Task } from '../../api/tasks';
import { useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useUIStore } from '../../store/uiStore';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const openTaskModal = useUIStore((state) => state.openTaskModal);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask.mutateAsync({
      id: task._id,
      data: { status: newStatus },
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask.mutateAsync(task._id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      className={`
        group bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer
        ${task.status === 'done' ? 'opacity-60' : ''}
        ${isOverdue ? 'border-red-300' : 'border-gray-200'}
      `}
      onClick={() => openTaskModal(task._id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          openTaskModal(task._id);
        }
      }}
      aria-label={`Task: ${task.title}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`
            mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
            transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
            ${task.status === 'done' ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-500'}
          `}
          aria-label={task.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.status === 'done' && (
            <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-gray-900 ${task.status === 'done' ? 'line-through' : ''}`}>
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{task.description}</p>
          )}

          {/* Metadata */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {/* Priority */}
            <span className={`px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>

            {/* Due date */}
            {task.dueDate && (
              <span className={`px-2 py-1 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                📅 {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}

            {/* Tags */}
            {task.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                #{tag}
              </span>
            ))}

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                ✓ {task.subtasks.filter(st => st.done).length}/{task.subtasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Delete task"
          >
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
