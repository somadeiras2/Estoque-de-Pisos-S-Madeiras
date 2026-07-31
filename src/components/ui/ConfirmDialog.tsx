'use client';

import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'primary' | 'destructive' | 'default';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="w-10 h-10 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-10 h-10 text-amber-600" />;
      case 'info':
      case 'primary':
        return <Info className="w-10 h-10 text-teal-600" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger': return 'danger';
      case 'warning': return 'primary';
      case 'info':
      case 'primary': return 'primary';
      default: return 'primary';
    }
  };

  const textToDisplay = message || description || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center pt-4 pb-2">
        <div className="mb-4">
          {getIcon()}
        </div>
        <p className="text-slate-600 mb-6">
          {textToDisplay}
        </p>
        
        <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:justify-end mt-4">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={loading}
            fullWidth
            className="sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button 
            variant={getConfirmButtonVariant()} 
            onClick={onConfirm} 
            loading={loading}
            fullWidth
            className="sm:w-auto"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
