'use client';

import { useParams } from 'next/navigation';
import { MessageThread } from '@/components/shared/MessageThread';

export default function ClienteMensajes() {
  const { clienteId } = useParams() as { clienteId: string };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-serif text-accent">Mensajes con la Agencia</h3>
        <p className="text-xs text-muted">Habla directamente con nuestro equipo de diseño y marketing en tiempo real.</p>
      </div>

      <div className="max-w-4xl">
        <MessageThread clienteId={clienteId} rol="cliente" />
      </div>
    </div>
  );
}
