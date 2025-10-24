import { useState } from 'react';
import { useCreateTask } from '../../hooks/useTasks/useTasks';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/ui/button/Button';

export const QuickAdd = () => {
  const [title, setTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedListId = useUIStore((state) => state.selectedListId);
  const createTask = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        listId: selectedListId || undefined,
        status: 'todo',
      });
      setTitle('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
      setTitle('');
    }
  };

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder="Quick add task... (Enter to save, Esc to cancel)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Quick add task"
          />
          {isExpanded && (
            <Button
              type="submit"
              disabled={!title.trim() || createTask.isPending}
              isLoading={createTask.isPending}
              size="md"
            >
              Add
            </Button>
          )}
        </div>
        {isExpanded && (
          <p className="text-xs text-gray-500">
            Tip: Use @ for tags, # for lists, and natural language for dates (coming soon)
          </p>
        )}
      </form>
    </div>
  );
};
