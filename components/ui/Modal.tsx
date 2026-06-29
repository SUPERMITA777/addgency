import React from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-sm shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-lg font-serif font-medium text-text">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-text font-mono text-lg p-1 transition duration-200"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto font-sans text-sm leading-relaxed text-text">
          {children}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end space-x-3 bg-bg/20">
          {footer || (
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default Modal;
