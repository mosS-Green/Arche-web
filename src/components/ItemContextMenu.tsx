import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { useApp } from '../context/AppContext';
import { Edit2, Copy, Trash2 } from 'lucide-react';

interface ItemContextMenuProps {
  children: React.ReactNode;
  category: string;
  item: any;
  onEdit: () => void;
}

export const ItemContextMenu: React.FC<ItemContextMenuProps> = ({
  children,
  category,
  item,
  onEdit
}) => {
  const { deleteItem, duplicateItem } = useApp();

  const handleDuplicate = async () => {
    await duplicateItem(category, item);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(category, item.id);
    }
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div className="w-full h-full cursor-context-menu select-none">
          {children}
        </div>
      </ContextMenu.Trigger>
      
      <ContextMenu.Portal>
        <ContextMenu.Content 
          className="min-w-[160px] bg-surface/90 border border-surface rounded-xl p-1.5 shadow-2xl z-50 backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-100 selection:bg-accent-personal selection:text-bg"
        >
          {/* Edit Option */}
          <ContextMenu.Item 
            onClick={onEdit}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-display text-ink-primary hover:text-bg hover:bg-accent-personal rounded-lg outline-none cursor-pointer transition-colors duration-150"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Item</span>
          </ContextMenu.Item>

          {/* Duplicate Option */}
          <ContextMenu.Item 
            onClick={handleDuplicate}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-display text-ink-primary hover:text-bg hover:bg-accent-work rounded-lg outline-none cursor-pointer transition-colors duration-150"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="h-px bg-surface my-1.5" />

          {/* Delete Option - Danger Red, Always Last */}
          <ContextMenu.Item 
            onClick={handleDelete}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-display text-danger hover:text-bg hover:bg-danger rounded-lg outline-none cursor-pointer transition-colors duration-150"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </ContextMenu.Item>

        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
