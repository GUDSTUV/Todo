import { useState, useEffect } from 'react';
import { useList, useCreateList, useUpdateList, useDeleteList } from '../../hooks/useList/useLists';
import { useUIStore } from '../../store/uiStore';
import { Modal } from '../../components/ui/modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/textarea/Textarea';
import { Button } from '../../components/ui/button/Button';
import type { CreateListData, UpdateListData } from '../../api/lists/lists';
// import type { CreateListData, UpdateListData } from '../../api/lists';

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export const ListModal = () => {
  const isOpen = useUIStore((state) => state.isListModalOpen);
  const selectedListForEdit = useUIStore((state) => state.selectedListForEdit);
  const closeListModal = useUIStore((state) => state.closeListModal);

  const { data: listData } = useList(selectedListForEdit || '');
  const { mutate: createList, isPending: isCreating } = useCreateList();
  const { mutate: updateList, isPending: isUpdating } = useUpdateList();
  const { mutate: deleteList, isPending: isDeleting } = useDeleteList();

  const list = listData?.data;
  const isEditMode = !!selectedListForEdit;

  const [formData, setFormData] = useState<CreateListData>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
  });

  useEffect(() => {
    if (list && isEditMode) {
      setFormData({
        name: list.name,
        description: list.description || '',
        color: list.color,
      });
    } else if (!isEditMode) {
      setFormData({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0],
      });
    }
  }, [list, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    if (isEditMode && selectedListForEdit) {
      const updates: UpdateListData = {
        id: ''
      };
      if (formData.name !== list?.name) updates.name = formData.name;
      if (formData.description !== list?.description) updates.description = formData.description;
      if (formData.color !== list?.color) updates.color = formData.color;

      updateList(
        { id: selectedListForEdit, data: updates },
        {
          onSuccess: () => {
            closeListModal();
          },
        }
      );
    } else {
      createList(formData, {
        onSuccess: () => {
          closeListModal();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!selectedListForEdit) return;

    if (window.confirm('Are you sure you want to delete this list? Tasks will be moved to Inbox.')) {
      deleteList(
        { id: selectedListForEdit },
        {
          onSuccess: () => {
            closeListModal();
          },
        }
      );
    }
  };

  const handleClose = () => {
    closeListModal();
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
    });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit List' : 'Create New List'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="List Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Work, Personal, Shopping"
          autoFocus
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description..."
          rows={3}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`
                  w-8 h-8 rounded-full transition-transform
                  ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}
                `}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          {isEditMode ? (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={list?.isDefault}
            >
              Delete List
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating || isUpdating}>
              {isEditMode ? 'Update' : 'Create'} List
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
