'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/client';

interface FileViewerProps {
  trabajoId: string;
  tipo: 'imagen' | 'pdf' | 'video';
}

export const FileViewer: React.FC<FileViewerProps> = ({ trabajoId, tipo }) => {
  const [srcUrl, setSrcUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let objectUrl = '';

    const loadFile = async () => {
      setLoading(true);
      setError('');

      try {
        const token = await auth.currentUser?.getIdToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        if (tipo === 'video') {
          // Fetch signed video URL from our proxy endpoint
          const res = await fetch(`/api/video/${trabajoId}`, { headers });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Fallo al obtener enlace del video');
          }
          const data = await res.json();
          setSrcUrl(data.url);
        } else {
          // Fetch image/PDF as blob to send Authorization token securely
          const endpoint = tipo === 'imagen' ? 'imagen' : 'pdf';
          const res = await fetch(`/api/trabajos/${trabajoId}/${endpoint}`, { headers });
          if (!res.ok) {
            throw new Error('No se pudo descargar el archivo con marca de agua.');
          }
          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          setSrcUrl(objectUrl);
        }
      } catch (err: any) {
        console.error('FileViewer load error:', err);
        setError(err.message || 'Error al cargar el visualizador de archivo.');
      } finally {
        setLoading(false);
      }
    };

    // Make sure we have an authenticated user before calling the API
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadFile();
      } else {
        setLoading(false);
      }
    });

    // Cleanup object URL
    return () => {
      unsubscribe();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [trabajoId, tipo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border rounded-sm h-[400px]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-muted font-mono uppercase tracking-wider">Cargando entregable protegido...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border border-danger/30 rounded-sm h-[400px] text-center">
        <span className="text-danger font-mono text-xs uppercase mb-3">Error de Visualización</span>
        <p className="text-sm text-text max-w-sm">{error}</p>
      </div>
    );
  }

  if (tipo === 'imagen') {
    return (
      <div className="relative border border-border bg-black/40 p-2 rounded-sm overflow-hidden flex items-center justify-center min-h-[400px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcUrl}
          alt="Entregable de diseño"
          className="max-w-full max-h-[70vh] object-contain rounded-sm shadow-md"
        />
      </div>
    );
  }

  if (tipo === 'pdf') {
    return (
      <div className="border border-border rounded-sm overflow-hidden h-[75vh] bg-surface">
        <iframe
          src={`${srcUrl}#toolbar=0`}
          className="w-full h-full border-none"
          title="Visor de PDF con marca de agua"
        />
      </div>
    );
  }

  if (tipo === 'video') {
    return (
      <div className="relative border border-border bg-black rounded-sm overflow-hidden flex items-center justify-center min-h-[400px]">
        <video
          src={srcUrl}
          controls
          controlsList="nodownload"
          className="max-w-full max-h-[70vh] rounded-sm"
        />
      </div>
    );
  }

  return null;
};
export default FileViewer;
