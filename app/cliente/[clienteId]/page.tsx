'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase/client';

export default function ClienteDashboard() {
  const { clienteId } = useParams() as { clienteId: string };
  const [stats, setStats] = useState({
    aprobados: 0,
    enRevision: 0,
    tickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        // 1. Fetch approved works count
        const approvedQuery = query(
          collection(firestore, 'trabajos'),
          where('clienteId', '==', clienteId),
          where('estado', '==', 'aprobado')
        );
        const approvedSnapshot = await getDocs(approvedQuery);
        const approvedCount = approvedSnapshot.size;

        // 2. Fetch works waiting for review
        const reviewQuery = query(
          collection(firestore, 'trabajos'),
          where('clienteId', '==', clienteId),
          where('estado', '==', 'esperando_revision')
        );
        const reviewSnapshot = await getDocs(reviewQuery);
        const reviewCount = reviewSnapshot.size;

        // 3. Fetch open tickets
        const ticketsQuery = query(
          collection(firestore, 'tickets'),
          where('clienteId', '==', clienteId),
          where('estado', 'in', ['abierto', 'en_proceso'])
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsCount = ticketsSnapshot.size;

        setStats({
          aprobados: approvedCount,
          enRevision: reviewCount,
          tickets: ticketsCount,
        });
      } catch (err: any) {
        console.error('Error loading client dashboard stats:', err);
        setError('Error al conectar con la base de datos de Firestore');
      } finally {
        setLoading(false);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadStats();
      }
    });

    return () => unsubscribe();
  }, [clienteId]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs p-4 rounded-[2px] font-mono">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Entregas Aprobadas</span>
          <h3 className="text-3xl font-serif text-accent">
            {loading ? '...' : stats.aprobados}
          </h3>
        </div>

        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">En Revisión</span>
          <h3 className="text-3xl font-serif text-accent">
            {loading ? '...' : stats.enRevision}
          </h3>
        </div>

        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Tickets de Consulta</span>
          <h3 className="text-3xl font-serif text-accent">
            {loading ? '...' : stats.tickets}
          </h3>
        </div>
      </div>

      <div className="bg-surface border border-border p-6 rounded-sm">
        <h3 className="text-lg font-serif mb-4 text-text">Resumen del Proyecto</h3>
        <p className="text-xs text-muted font-sans leading-relaxed">
          Tus archivos listos para descarga estarán disponibles en la pestaña &quot;Mis Trabajos&quot;. Si deseas solicitar modificaciones o aprobaciones, puedes abrir una consulta en la sección de Soporte.
        </p>
      </div>
    </div>
  );
}
