'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase/client';
import { Badge } from '@/components/ui/Badge';
import { DragDropUpload } from '@/components/admin/DragDropUpload';
import Link from 'next/link';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  empresa: string;
  subdominio: string;
  planActual: string;
  planEstado: string;
}

interface Trabajo {
  id: string;
  titulo: string;
  tipo: string;
  estado: string;
  archivoUrl: string;
  version: number;
  creadoEn: any;
}

export default function AdminClienteDetalle() {
  const { clienteId } = useParams() as { clienteId: string };
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      // Fetch client info from our secure API endpoint
      const clientRes = await fetch(`/api/clientes/${clienteId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!clientRes.ok) {
        throw new Error('Error al cargar la información del cliente');
      }

      const clientData = await clientRes.json();
      setCliente(clientData);

      // Fetch client's jobs directly from Firestore (client-side SDK query)
      const q = query(
        collection(firestore, 'trabajos'),
        where('clienteId', '==', clienteId)
      );

      const querySnapshot = await getDocs(q);
      const jobsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trabajo[];

      // Sort by creation date
      jobsData.sort((a, b) => {
        const timeA = a.creadoEn?.seconds || 0;
        const timeB = b.creadoEn?.seconds || 0;
        return timeB - timeA;
      });

      setTrabajos(jobsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al obtener detalles del cliente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchDetails();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [clienteId]);

  const handleUploadSuccess = (newTrabajo: Trabajo) => {
    setTrabajos([newTrabajo, ...trabajos]);
  };

  if (loading) {
    return <div className="text-center font-mono text-xs text-muted py-20">Cargando detalles...</div>;
  }

  if (error || !cliente) {
    return (
      <div className="space-y-4 max-w-xl mx-auto text-center py-20">
        <h3 className="text-lg font-serif text-danger">Error</h3>
        <p className="text-sm text-muted">{error || 'No se encontró el cliente solicitado.'}</p>
        <Link href="/admin/clientes" className="text-xs font-mono text-accent hover:underline">
          &larr; Volver a Clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Client Overview Card */}
      <div className="bg-surface border border-border p-6 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] text-accent uppercase font-mono tracking-widest">Inquilino Activo</span>
          <h2 className="text-3xl font-serif text-text mt-1">{cliente.empresa}</h2>
          <p className="text-xs text-muted font-sans mt-1">
            Representante: {cliente.nombre} &bull; {cliente.email}
          </p>
        </div>
        <div className="text-left md:text-right border-l md:border-l-0 md:border-r border-border pl-4 md:pl-0 md:pr-4">
          <div className="text-xs text-muted font-sans uppercase tracking-widest font-light">Subdominio</div>
          <div className="text-sm font-mono text-accent mt-0.5">{cliente.subdominio}.tuagencia.com</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Drag & Drop upload */}
        <div className="lg:col-span-1">
          <DragDropUpload clienteId={clienteId} onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Right Column: Historical Uploads */}
        <div className="lg:col-span-2 space-y-4 bg-surface border border-border p-6 rounded-sm">
          <h3 className="text-lg font-serif text-text">Historial de Entregables</h3>

          {trabajos.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted font-sans font-light">
              No hay trabajos subidos para este cliente.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {trabajos.map((trabajo) => (
                <div key={trabajo.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                  <div>
                    <h4 className="font-sans font-medium text-text text-sm">{trabajo.titulo}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-mono text-muted uppercase">{trabajo.tipo}</span>
                      <span className="text-[10px] font-mono text-muted">&bull;</span>
                      <span className="text-[10px] font-mono text-muted">v{trabajo.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
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
                    <Link href={`/admin/trabajos/${trabajo.id}`}>
                      <button className="text-xs font-mono text-accent hover:underline">Ver detalle</button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
