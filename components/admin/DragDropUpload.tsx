'use client';

import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface DragDropUploadProps {
  clienteId: string;
  onUploadSuccess: (trabajo: any) => void;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  clienteId,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [marcaDeAgua, setMarcaDeAgua] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!titulo) {
        // Auto-fill title with file name without extension
        setTitulo(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!titulo) {
        setTitulo(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !titulo.trim()) {
      setError('Por favor, ingresa un título y selecciona un archivo.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('clienteId', clienteId);
    formData.append('titulo', titulo.trim());
    formData.append('descripcion', descripcion.trim());
    formData.append('marcaDeAgua', marcaDeAgua ? 'true' : 'false');
    formData.append('archivo', file);

    try {
      // Get the Firebase ID token for Authorization header
      // In a real flow, auth.currentUser?.getIdToken() is used
      // Let's import auth client side
      const { auth } = await import('@/lib/firebase/client');
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch('/api/trabajos/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir archivo');
      }

      const data = await response.json();
      
      // Reset form
      setFile(null);
      setTitulo('');
      setDescripcion('');
      setMarcaDeAgua(true);
      
      onUploadSuccess(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión al servidor.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-surface border border-border p-6 rounded-sm">
      <h3 className="text-lg font-serif text-accent">Subir Nuevo Trabajo</h3>

      {error && (
        <div className="bg-danger/10 border border-danger text-text text-xs p-3 rounded-sm font-mono">
          {error}
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`border border-dashed p-10 rounded-sm text-center cursor-pointer transition-all duration-200 ${
          dragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,application/pdf,video/*"
        />

        {file ? (
          <div className="space-y-2">
            <p className="text-sm font-mono text-accent">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-xs text-danger underline hover:opacity-80"
            >
              Remover archivo
            </button>
          </div>
        ) : (
          <div className="space-y-2 text-muted">
            <p className="text-sm">Arrastra y suelta tu archivo aquí, o <span className="text-accent underline">examina tus archivos</span></p>
            <p className="text-[11px] font-mono">Imágenes, PDFs o Videos</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Título del Trabajo"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <div className="flex flex-col space-y-1.5 w-full">
          <label className="text-xs uppercase tracking-wider text-muted font-sans font-light">
            Descripción
          </label>
          <input
            type="text"
            className="w-full"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="ej: Versión final para feed de Instagram"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="marcaDeAgua"
          checked={marcaDeAgua}
          onChange={(e) => setMarcaDeAgua(e.target.checked)}
          className="rounded-[2px] border-border bg-surface text-accent focus:ring-accent"
        />
        <label htmlFor="marcaDeAgua" className="text-xs text-muted font-sans cursor-pointer select-none">
          Aplicar marca de agua al servir este archivo (Recomendado para imágenes y PDFs)
        </label>
      </div>

      <Button type="submit" disabled={uploading || !file} className="w-full">
        {uploading ? 'Subiendo archivo...' : 'Guardar y Subir'}
      </Button>
    </form>
  );
};
export default DragDropUpload;
