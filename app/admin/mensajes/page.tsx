'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/client';
import { MessageThread } from '@/components/shared/MessageThread';

interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
}

export default function AdminMensajes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/clientes', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error('Error al cargar la lista de clientes');
        }

        const data = await res.json();
        setClientes(data);
        if (data.length > 0) {
          setSelectedClienteId(data[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setError('Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchClientes();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-center font-mono text-xs text-muted py-20">Cargando bandeja de entrada...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-serif text-accent">Centro de Mensajes</h3>
        <p className="text-xs text-muted">Comunícate directamente y en tiempo real con cada uno de tus clientes.</p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger text-text text-xs p-3 rounded-sm font-mono">
          {error}
        </div>
      )}

      {clientes.length === 0 ? (
        <div className="bg-surface border border-border p-12 text-center text-muted font-sans font-light rounded-sm">
          No hay clientes registrados con los cuales iniciar una conversación.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Client Selector Sidebar */}
          <div className="md:col-span-1 bg-surface border border-border rounded-sm p-4 h-[65vh] overflow-y-auto">
            <h4 className="text-xs font-mono uppercase tracking-widest text-muted mb-4 border-b border-border pb-2">Chats Activos</h4>
            <div className="space-y-2">
              {clientes.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => setSelectedClienteId(cliente.id)}
                  className={`w-full text-left p-3 rounded-sm text-sm font-sans transition duration-200 ${
                    selectedClienteId === cliente.id
                      ? 'bg-accent text-bg font-semibold'
                      : 'hover:bg-border/30 text-text'
                  }`}
                >
                  <div className="truncate font-medium">{cliente.empresa}</div>
                  <div className={`text-[10px] ${selectedClienteId === cliente.id ? 'text-bg/70' : 'text-muted'}`}>
                    {cliente.nombre}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Chat Thread */}
          <div className="md:col-span-3">
            {selectedClienteId ? (
              <MessageThread clienteId={selectedClienteId} rol="admin" />
            ) : (
              <div className="h-[65vh] flex items-center justify-center border border-border bg-surface text-muted text-sm font-sans font-light">
                Selecciona un cliente para ver la conversación.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
