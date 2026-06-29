'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Ticket {
  id: string;
  clienteId: string;
  trabajoId?: string;
  tipo: 'consulta' | 'pedido' | 'modificacion' | 'aprobacion' | 'rechazo';
  estado: 'abierto' | 'en_proceso' | 'resuelto';
  mensaje: string;
  respuesta?: string;
  creadoEn: any;
  creadoPor: string;
}

interface Cliente {
  id: string;
  empresa: string;
  nombre: string;
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clientes, setClientes] = useState<Record<string, Cliente>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newEstado, setNewEstado] = useState<'en_proceso' | 'resuelto'>('resuelto');
  const [associatedJobTitle, setAssociatedJobTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch clients to map IDs to company names
    const fetchClientes = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/clientes', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const list = await res.json();
          const mapped: Record<string, Cliente> = {};
          list.forEach((c: any) => {
            mapped[c.id] = c;
          });
          setClientes(mapped);
        }
      } catch (err) {
        console.error('Error fetching clients for tickets:', err);
      }
    };

    // 2. Subscribe to all tickets in real-time
    const q = query(collection(firestore, 'tickets'), orderBy('creadoEn', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Ticket[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setTickets(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    fetchClientes();

    return () => unsubscribe();
  }, []);

  // Fetch job title if associated with a work
  useEffect(() => {
    const fetchJobTitle = async () => {
      if (selectedTicket?.trabajoId) {
        setAssociatedJobTitle('Cargando...');
        try {
          const jobSnap = await getDoc(doc(firestore, 'trabajos', selectedTicket.trabajoId));
          if (jobSnap.exists()) {
            setAssociatedJobTitle(jobSnap.data().titulo || 'Sin título');
          } else {
            setAssociatedJobTitle('Trabajo no encontrado');
          }
        } catch (err) {
          setAssociatedJobTitle('Error al cargar trabajo');
        }
      } else {
        setAssociatedJobTitle('');
      }
    };

    fetchJobTitle();
  }, [selectedTicket]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          respuesta: replyText.trim(),
          estado: newEstado,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al responder el ticket');
      }

      setReplyText('');
      setSelectedTicket(null);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center font-mono text-xs text-muted py-20">Cargando bandeja de tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-serif text-accent">Bandeja de Tickets</h3>
        <p className="text-xs text-muted">Responde y gestiona los requerimientos, dudas y pedidos de los clientes.</p>
      </div>

      <div className="bg-surface border border-border rounded-sm overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted font-sans font-light">
            No hay tickets registrados en el sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/40 font-mono text-xs text-muted uppercase">
                  <th className="p-4 font-normal">Cliente</th>
                  <th className="p-4 font-normal">Mensaje</th>
                  <th className="p-4 font-normal">Tipo</th>
                  <th className="p-4 font-normal">Estado</th>
                  <th className="p-4 font-normal text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((ticket) => {
                  const cliente = clientes[ticket.clienteId];
                  return (
                    <tr key={ticket.id} className="hover:bg-bg/10 transition duration-150">
                      <td className="p-4">
                        <div className="font-serif text-text font-medium">{cliente?.empresa || 'Cargando...'}</div>
                        <div className="text-xs text-muted">{cliente?.nombre}</div>
                      </td>
                      <td className="p-4 max-w-sm truncate font-sans font-light text-text">
                        {ticket.mensaje}
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-mono text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-[2px] uppercase">
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
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setReplyText(ticket.respuesta || '');
                            setNewEstado(ticket.estado === 'resuelto' ? 'resuelto' : 'resuelto');
                          }}
                          className="text-xs font-mono text-accent hover:underline"
                        >
                          Atender &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedTicket && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
          title={`Atender Ticket - ${clientes[selectedTicket.clienteId]?.empresa || ''}`}
          footer={
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => setSelectedTicket(null)}>
                Cancelar
              </Button>
              <Button type="submit" form="reply-ticket-form" disabled={submitting || !replyText.trim()}>
                {submitting ? 'Enviando...' : 'Guardar Respuesta'}
              </Button>
            </div>
          }
        >
          <form id="reply-ticket-form" onSubmit={handleReply} className="space-y-4 font-sans text-sm">
            {error && (
              <div className="bg-danger/10 border border-danger text-text text-xs p-3 rounded-sm font-mono">
                {error}
              </div>
            )}

            {/* Ticket details */}
            <div className="bg-bg/40 border border-border p-4 rounded-sm space-y-2">
              <div className="flex justify-between text-xs text-muted font-mono uppercase">
                <span>Tipo: {selectedTicket.tipo}</span>
                <span>Creado por: {selectedTicket.creadoPor}</span>
              </div>
              <div className="text-text leading-relaxed font-light">{selectedTicket.mensaje}</div>
              
              {associatedJobTitle && (
                <div className="text-xs text-accent mt-2 pt-2 border-t border-border/40 font-mono">
                  Trabajo asociado: {associatedJobTitle}
                </div>
              )}
            </div>

            {/* Status updates */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted font-sans font-light">
                Actualizar Estado
              </label>
              <select
                value={newEstado}
                onChange={(e) => setNewEstado(e.target.value as any)}
                className="bg-surface border border-border text-text rounded-[4px] px-3 py-2"
              >
                <option value="en_proceso">En Proceso</option>
                <option value="resuelto">Resuelto (Aprobado/Finalizado)</option>
              </select>
            </div>

            {/* Textarea */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted font-sans font-light">
                Respuesta para el Cliente
              </label>
              <textarea
                required
                rows={4}
                className="bg-surface border border-border text-text rounded-sm p-3 text-sm focus:outline-none focus:border-accent"
                placeholder="Escribe la respuesta o feedback aquí..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
