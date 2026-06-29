'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase/client';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface Trabajo {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'imagen' | 'video' | 'pdf';
  estado: 'en_revision' | 'aprobado' | 'rechazado' | 'en_modificacion';
  version: number;
  creadoEn: any;
}

export default function ClienteTrabajos() {
  const { clienteId } = useParams() as { clienteId: string };
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrabajos = async () => {
    try {
      const q = query(
        collection(firestore, 'trabajos'),
        where('clienteId', '==', clienteId)
      );

      const querySnapshot = await getDocs(q);
      const jobs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trabajo[];

      // Sort by creation date
      jobs.sort((a, b) => {
        const timeA = a.creadoEn?.seconds || 0;
        const timeB = b.creadoEn?.seconds || 0;
        return timeB - timeA;
      });

      setTrabajos(jobs);
    } catch (err: any) {
      console.error('Error fetching client works:', err);
      setError('No se pudieron obtener los trabajos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchTrabajos();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [clienteId]);

  if (loading) {
    return <div className="text-center font-mono text-xs text-muted py-20">Cargando tus entregables...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-serif text-accent">Mis Entregables</h3>
        <p className="text-xs text-muted">Revisa las propuestas de diseño y marketing realizadas por la agencia.</p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger text-text text-xs p-3 rounded-sm font-mono">
          {error}
        </div>
      )}

      {trabajos.length === 0 ? (
        <div className="bg-surface border border-border p-12 text-center text-muted font-sans font-light rounded-sm">
          No tienes propuestas de diseño o entregables asignados en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trabajos.map((trabajo) => (
            <div
              key={trabajo.id}
              className="bg-surface border border-border p-6 rounded-sm flex flex-col justify-between space-y-4 hover:border-accent transition duration-200"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
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
                  <span className="text-[10px] font-mono text-muted uppercase">v{trabajo.version}</span>
                </div>
                <h4 className="font-serif text-lg text-text font-medium leading-tight mb-1">{trabajo.titulo}</h4>
                <p className="text-xs text-muted font-sans line-clamp-2">{trabajo.descripcion || 'Sin descripción.'}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">{trabajo.tipo}</span>
                <Link href={`/trabajos/${trabajo.id}`}>
                  <button className="text-xs font-mono text-accent hover:underline">Revisar propuesta &rarr;</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
