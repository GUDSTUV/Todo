import React from 'react';

// Note: This component was previously implemented with @dnd-kit, but the app uses
// @hello-pangea/dnd for drag-and-drop. To avoid unused dependency errors, this now
// acts as a simple passthrough wrapper.

interface DraggableTaskProps {
  id?: string;
  children: React.ReactNode;
}

export const DraggableTask: React.FC<DraggableTaskProps> = ({ children }) => {
  return <>{children}</>;
};
