'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase/client';
import { FileViewer } from '@/components/shared/FileViewer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';

interface Trabajo {
  id: string;
  clienteId: string;
  titulo: string;
  descripcion: string;
  tipo: 'imagen' | 'video' | 'pdf';
  estado: 'en_revision' | 'aprobado' | 'rechazado' | 'en_modificacion';
  version: number;
}

export default function ClienteTrabajoDetalle() {
  const { clienteId, trabajoId } = useParams() as { clienteId: string; trabajoId: string };
  const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [pendingState, setPendingState] = useState<'rechazado' | 'en_modificacion' | null>(null);
  const [commentText, setCommentText] = useState('');
  const router = useRouter();

  const fetchTrabajo = async () => {
    try {
      const docRef = doc(firestore, 'trabajos', trabajoId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        throw new Error('El entregable solicitado no existe.');
      }
      setTrabajo({ id: snapshot.id, ...snapshot.data() } as Trabajo);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al obtener la información del trabajo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchTrabajo();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [trabajoId]);

  const handleUpdateStatus = async (newState: 'aprobado' | 'rechazado' | 'en_modificacion') => {
    setActionLoading(true);
    setError('');

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/trabajos/${trabajoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ estado: newState }),
      });

      if (!res.ok) {
        throw new Error('Fallo al actualizar el estado del trabajo.');
      }

      // If we rejected or requested modifications, let's also submit a support ticket with the feedback comment
      if ((newState === 'rechazado' || newState === 'en_modificacion') && commentText.trim()) {
        await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            clienteId,
            trabajoId,
            tipo: newState === 'rechazado' ? 'rechazo' : 'modificacion',
            mensaje: `Comentarios sobre "${trabajo?.titulo}" (v${trabajo?.version}): ${commentText.trim()}`,
            estado: 'abierto',
          }),
        });
      }

      // Reset
      setCommentModalOpen(false);
      setCommentText('');
      setPendingState(null);

      // Refresh data
      await fetchTrabajo();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCommentModal = (state: 'rechazado' | 'en_modificacion') => {
    setPendingState(state);
    setCommentModalOpen(true);
  };

  if (loading) {
    return <div className="text-center font-mono text-xs text-muted py-20">Cargando propuesta...</div>;
  }

  if (error || !trabajo) {
    return (
      <div className="space-y-4 max-w-xl mx-auto text-center py-20">
        <h3 className="text-lg font-serif text-danger">Error</h3>
        <p className="text-sm text-muted">{error || 'El entregable no pudo ser cargado.'}</p>
        <Link href="/trabajos" className="text-xs font-mono text-accent hover:underline">
          &larr; Volver a Mis Trabajos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
        <div>
          <Link href="/trabajos" className="text-xs font-mono text-muted hover:underline block mb-2">
            &larr; Volver a Trabajos
          </Link>
          <div className="flex items-center space-x-3">
            <h3 className="text-2xl font-serif text-text font-medium">{trabajo.titulo}</h3>
            <Badge
              variant={
                trabajo.estado === 'aprobado'
                  ? 'success'
                  : trabajo.estado === 'rechazado'
                  ? 'danger'
                  : trabajo.estado === 'en_revision'
                  ? 'warning'
                  : 'default'
              }
            >
              {trabajo.estado.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-muted font-sans mt-1">{trabajo.descripcion || 'Sin descripción.'}</p>
        </div>

        {/* Action buttons if in revision or modification */}
        {trabajo.estado === 'en_revision' && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={actionLoading}
              onClick={() => openCommentModal('en_modificacion')}
            >
              Solicitar Modificación
            </Button>
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={() => openCommentModal('rechazado')}
            >
              Rechazar
            </Button>
            <Button
              variant="primary"
              disabled={actionLoading}
              onClick={() => handleUpdateStatus('aprobado')}
            >
              Aprobar Diseño
            </Button>
          </div>
        )}
      </div>

      {/* Visor de archivos con marca de agua */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-muted font-mono px-1">
          <span>Vista protegida con marca de agua</span>
          <span>Versión {trabajo.version}</span>
        </div>
        <FileViewer trabajoId={trabajoId} tipo={trabajo.tipo} />
      </div>

      {/* Modal for feedback */}
      <Modal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        title={pendingState === 'rechazado' ? 'Rechazar Entregable' : 'Solicitar Modificaciones'}
        footer={
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => setCommentModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={pendingState === 'rechazado' ? 'danger' : 'primary'}
              disabled={actionLoading}
              onClick={() => pendingState && handleUpdateStatus(pendingState)}
            >
              Enviar Comentarios
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted">
            Por favor, escribe tus comentarios o requerimientos de cambio detallados para que nuestro equipo pueda resolverlos a la brevedad.
          </p>
          <textarea
            required
            className="w-full h-32 bg-bg border border-border text-text rounded-sm p-3 text-sm focus:outline-none focus:border-accent"
            placeholder="Escribe aquí las modificaciones que necesitas..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
