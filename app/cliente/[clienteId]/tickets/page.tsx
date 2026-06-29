'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

interface Ticket {
  id: string;
  clienteId: string;
  trabajoId?: string;
  tipo: 'consulta' | 'pedido' | 'modificacion' | 'aprobacion' | 'rechazo';
  estado: 'abierto' | 'en_proceso' | 'resuelto';
  mensaje: string;
  respuesta?: string;
  creadoEn: any;
  respondidoEn?: any;
}

interface Trabajo {
  id: string;
  titulo: string;
}

export default function ClienteTickets() {
  const { clienteId } = useParams() as { clienteId: string };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [tipo, setTipo] = useState<'consulta' | 'pedido' | 'modificacion'>('consulta');
  const [selectedTrabajoId, setSelectedTrabajoId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Subscribe to tickets real-time updates
    const q = query(
      collection(firestore, 'tickets'),
      where('clienteId', '==', clienteId),
      orderBy('creadoEn', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Ticket[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setTickets(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching tickets:', err);
      setLoading(false);
    });

    // 2. Fetch jobs list for selector
    const fetchTrabajos = async () => {
      try {
        const jobsSnap = await getDocs(
          query(collection(firestore, 'trabajos'), where('clienteId', '==', clienteId))
        );
        const list = jobsSnap.docs.map((d) => ({
          id: d.id,
          titulo: d.data().titulo || 'Trabajo sin título',
        }));
        setTrabajos(list);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      }
    };

    fetchTrabajos();

    return () => unsubscribe();
  }, [clienteId]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clienteId,
          tipo,
          trabajoId: selectedTrabajoId || null,
          mensaje: mensaje.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al procesar el ticket');
      }

      // Reset
      setMensaje('');
      setSelectedTrabajoId('');
      setTipo('consulta');
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center font-mono text-xs text-muted py-20">Cargando tus consultas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-serif text-accent">Tickets y Consultas</h3>
          <p className="text-xs text-muted">Envía dudas, solicita cambios o aprueba propuestas de manera organizada.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Nueva Consulta</Button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-surface border border-border p-12 text-center text-muted font-sans font-light rounded-sm">
          No tienes consultas o tickets abiertos.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/40 font-mono text-xs text-muted uppercase">
                  <th className="p-4 font-normal">Detalles</th>
                  <th className="p-4 font-normal">Tipo</th>
                  <th className="p-4 font-normal">Estado</th>
                  <th className="p-4 font-normal">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-bg/10 transition duration-150">
                    <td className="p-4 space-y-2 max-w-lg">
                      <div className="text-text font-sans font-medium">{ticket.mensaje}</div>
                      {ticket.respuesta && (
                        <div className="bg-bg/40 border-l-2 border-accent p-3 text-xs text-muted rounded-sm mt-1">
                          <span className="font-mono text-accent block mb-1">Respuesta de la Agencia:</span>
                          <span className="font-sans font-light text-text">{ticket.respuesta}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-[2px] uppercase">
                        {ticket.tipo}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          ticket.estado === 'resuelto'
                            ? 'success'
                            : ticket.estado === 'en_proceso'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {ticket.estado.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono text-xs text-muted">
                      {ticket.creadoEn
                        ? new Date(ticket.creadoEn.seconds * 1000).toLocaleDateString()
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Ticket */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear Nueva Consulta o Pedido"
        footer={
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="new-ticket-form" disabled={submitting || !mensaje.trim()}>
              {submitting ? 'Enviando...' : 'Crear Ticket'}
            </Button>
          </div>
        }
      >
        <form id="new-ticket-form" onSubmit={handleCreateTicket} className="space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger text-text text-xs p-3 rounded-sm font-mono">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ticket Type */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted font-sans font-light">
                Tipo de Requerimiento
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="bg-surface border border-border text-text rounded-[4px] px-3 py-2"
              >
                <option value="consulta">Consulta General</option>
                <option value="pedido">Nuevo Pedido</option>
                <option value="modificacion">Solicitar Modificación</option>
              </select>
            </div>

            {/* Associate Job */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted font-sans font-light">
                Trabajo Asociado (Opcional)
              </label>
              <select
                value={selectedTrabajoId}
                onChange={(e) => setSelectedTrabajoId(e.target.value)}
                className="bg-surface border border-border text-text rounded-[4px] px-3 py-2"
              >
                <option value="">Ninguno</option>
                {trabajos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted font-sans font-light">
              Mensaje o Descripción del Pedido
            </label>
            <textarea
              required
              rows={4}
              className="bg-surface border border-border text-text rounded-sm p-3 text-sm focus:outline-none focus:border-accent"
              placeholder="Describe detalladamente tu requerimiento..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
