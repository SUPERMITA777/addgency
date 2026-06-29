'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { auth } from '@/lib/firebase/client';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  empresa: string;
  subdominio: string;
  planActual: string;
  planEstado: 'vigente' | 'vencido' | 'pausado';
  planFechaVencimiento?: any;
}

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al obtener clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for Auth to load to get current user token
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchClientes();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas desactivar a este cliente?')) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Error al desactivar el cliente');
      }

      setClientes(clientes.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al procesar la solicitud');
    }
  };

  if (loading) {
    return <div className="text-center font-mono text-xs text-muted py-20">Cargando clientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-serif text-accent">Gestión de Clientes</h3>
          <p className="text-xs text-muted">Visualiza y configura los inquilinos (tenants) registrados en la agencia.</p>
        </div>
        <Link href="/admin/clientes/nuevo">
          <Button>Agregar Cliente</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger text-text text-xs p-3 rounded-sm font-mono">
          {error}
        </div>
      )}

      <div className="bg-surface border border-border rounded-sm overflow-hidden">
        {clientes.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted font-sans font-light">
            No hay clientes registrados en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/40 font-mono text-xs text-muted uppercase">
                  <th className="p-4 font-normal">Empresa / Nombre</th>
                  <th className="p-4 font-normal">Subdominio</th>
                  <th className="p-4 font-normal">Plan Actual</th>
                  <th className="p-4 font-normal">Estado</th>
                  <th className="p-4 font-normal text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-bg/20 transition duration-150">
                    <td className="p-4">
                      <div className="font-serif text-text text-base">{cliente.empresa}</div>
                      <div className="text-xs text-muted font-sans font-light">
                        {cliente.nombre} &bull; {cliente.email}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-accent text-xs">
                      {cliente.subdominio}.tuagencia.com
                    </td>
                    <td className="p-4 font-sans font-light">{cliente.planActual}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          cliente.planEstado === 'vigente'
                            ? 'success'
                            : cliente.planEstado === 'pausado'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {cliente.planEstado}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <Link href={`/admin/clientes/${cliente.id}`}>
                        <button className="text-xs font-mono text-accent hover:underline">Ver Perfil</button>
                      </Link>
                      <button
                        onClick={() => handleDeactivate(cliente.id)}
                        className="text-xs font-mono text-danger hover:underline"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
