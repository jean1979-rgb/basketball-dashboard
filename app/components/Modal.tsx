'use client';

import { ReactNode, useEffect } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-neutral-900 text-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
          <h2 className="font-semibold text-sm md:text-base">
            {title ?? 'Detalle del juego'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-300 hover:text-white text-xl leading-none px-2"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-4 md:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

