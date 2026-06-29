'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    clientes: 0,
    trabajos: 0,
    tickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const token = await auth.currentUser?.getIdToken();
        
        // 1. Fetch active clients count
        const clientRes = await fetch('/api/clientes', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        let clientCount = 0;
        if (clientRes.ok) {
          const clientsData = await clientRes.json();
          clientCount = clientsData.length;
        }

        // 2. Fetch works waiting for review
        const worksQuery = query(
          collection(firestore, 'trabajos'),
          where('estado', '==', 'esperando_revision')
        );
        const worksSnapshot = await getDocs(worksQuery);
        const worksCount = worksSnapshot.size;

        // 3. Fetch open/in-process tickets
        const ticketsQuery = query(
          collection(firestore, 'tickets'),
          where('estado', 'in', ['abierto', 'en_proceso'])
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsCount = ticketsSnapshot.size;

        setStats({
          clientes: clientCount,
          trabajos: worksCount,
          tickets: ticketsCount,
        });
      } catch (err: any) {
        console.error('Error loading dashboard stats:', err);
        setError('Error al cargar algunas estadísticas en tiempo real');
      } finally {
        setLoading(false);
      }
    }

    // Load stats only when user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadStats();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs p-4 rounded-[2px] font-mono">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Clientes Activos</span>
          <h3 className="text-3xl font-serif text-accent">
            {loading ? '...' : stats.clientes}
          </h3>
        </div>

        {/* Card 2 */}
        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Trabajos en Revisión</span>
          <h3 className="text-3xl font-serif text-accent">
            {loading ? '...' : stats.trabajos}
          </h3>
        </div>

        {/* Card 3 */}
        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Tickets Abiertos</span>
          <h3 className="text-3xl font-serif text-accent">
            {loading ? '...' : stats.tickets}
          </h3>
        </div>
      </div>

      <div className="bg-surface border border-border p-6 rounded-sm">
        <h3 className="text-lg font-serif mb-4 text-text">Actividad Reciente</h3>
        <p className="text-xs text-muted font-sans">
          Todos los sistemas operativos y operando normalmente con datos reales de Firestore.
        </p>
      </div>
    </div>
  );
}
