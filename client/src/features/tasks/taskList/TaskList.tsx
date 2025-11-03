import { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useTasks, useBulkUpdateTasks } from '../../../hooks/useTasks/useTasks';
import { useUIStore } from '../../../store/uiStore';
import { TaskCard } from '../taskCard/TaskCard';
import { Spinner } from '../../../components/ui/spinner/Spinner';
import type { TaskFilters } from '../../../api/tasks/tasks';
import type { FilterOptions } from '../../../components/ui/FilterBar';
import type { Task } from '../../../api/tasks/tasks';

interface TaskListProps {
  searchQuery?: string;
  filters?: FilterOptions;
}

export const TaskList = ({ searchQuery: propSearchQuery, filters: propFilters }: TaskListProps = {}) => {
  const selectedListId = useUIStore((state) => state.selectedListId);
  const searchQuery = useUIStore((state) => state.searchQuery);
  const statusFilter = useUIStore((state) => state.statusFilter);
  const priorityFilter = useUIStore((state) => state.priorityFilter);
  const tagFilters = useUIStore((state) => state.tagFilters);
  const sortBy = useUIStore((state) => state.sortBy);
  const sortOrder = useUIStore((state) => state.sortOrder);

  // Use props if provided, otherwise fall back to UI store
  const finalSearchQuery = propSearchQuery !== undefined ? propSearchQuery : searchQuery;
  const finalFilters = propFilters || {};

  const filters: TaskFilters = {
    listId: selectedListId || undefined,
    search: finalSearchQuery || undefined,
    status: finalFilters.status || statusFilter || undefined,
    priority: finalFilters.priority || priorityFilter || undefined,
    tags: finalFilters.tags || (tagFilters.length > 0 ? tagFilters : undefined),
    sortBy: finalFilters.sortBy || sortBy,
    sortOrder: finalFilters.sortOrder || sortOrder,
  };

  const { data, isLoading, error } = useTasks(filters);

  // Local ordered list to enable smooth drag reordering without waiting for refetch
  const initialTasks = useMemo(() => (data?.data || []) as Task[], [data]);
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    setOrderedTasks(initialTasks);
  }, [initialTasks]);

  const bulkUpdate = useBulkUpdateTasks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Failed to load tasks</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  const tasks = orderedTasks;

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tasks yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new task with Quick Add below.
          </p>
        </div>
      </div>
    );
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Reorder locally
    const updated = Array.from(tasks);
    const [moved] = updated.splice(source.index, 1);
    updated.splice(destination.index, 0, moved);
    setOrderedTasks(updated);

    // Persist new order only when sorting by custom order
    if (sortBy === 'order') {
      const updates = updated.map((t, idx) => ({ id: t._id, updates: { order: idx } }));
      bulkUpdate.mutate(updates);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="task-list">
        {(provided) => (
          <div className="space-y-3 p-4" ref={provided.innerRef} {...provided.droppableProps}>
            {tasks.map((task, index) => (
              <Draggable draggableId={task._id} index={index} key={task._id}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={snapshot.isDragging ? 'opacity-80' : ''}
                  >
                    <TaskCard task={task} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
