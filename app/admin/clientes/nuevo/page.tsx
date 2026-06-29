'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { auth } from '@/lib/firebase/client';
import Link from 'next/link';

export default function AdminNuevoCliente() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [subdominio, setSubdominio] = useState('');
  const [planActual, setPlanActual] = useState('Social Media');
  const [planFechaVencimiento, setPlanFechaVencimiento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubdominioChange = (val: string) => {
    // Only allow letters, numbers, and dashes (standard subdomain values)
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdominio(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !empresa.trim() || !subdominio.trim()) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await auth.currentUser?.getIdToken();
      
      const payload = {
        nombre: nombre.trim(),
        email: email.trim(),
        empresa: empresa.trim(),
        subdominio: subdominio.trim(),
        planActual,
        planFechaVencimiento: planFechaVencimiento ? new Date(planFechaVencimiento).toISOString() : undefined,
      };

      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar el cliente');
      }

      router.push('/admin/clientes');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-serif text-accent">Crear Nuevo Cliente</h3>
          <p className="text-xs text-muted">Registra un nuevo tenant e inicializa su subdominio dedicado.</p>
        </div>
        <Link href="/admin/clientes" className="text-xs font-mono text-muted hover:underline">
          &larr; Volver
        </Link>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger text-text text-xs p-3 rounded-sm font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border p-8 rounded-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nombre del Representante *"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej: Juan Pérez"
          />

          <Input
            label="Email de Contacto *"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ej: juan@empresa.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nombre de la Empresa *"
            required
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="ej: Pixel Agency"
          />

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted font-sans font-light">
              Subdominio Dedicado *
            </label>
            <div className="flex items-center">
              <input
                type="text"
                required
                className="w-full rounded-r-none border-r-0"
                value={subdominio}
                onChange={(e) => handleSubdominioChange(e.target.value)}
                placeholder="pixelagency"
              />
              <span className="bg-border/30 border border-border border-l-0 text-muted px-3 py-2 text-sm rounded-r-[4px] font-mono select-none">
                .tuagencia.com
              </span>
            </div>
            <span className="text-[10px] text-muted font-sans mt-1">
              Solo letras minúsculas, números y guiones. Sin espacios.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted font-sans font-light">
              Plan Inicial
            </label>
            <select
              value={planActual}
              onChange={(e) => setPlanActual(e.target.value)}
              className="bg-surface border border-border text-text rounded-[4px] px-3 py-2.5"
            >
              <option value="Social Media">Social Media</option>
              <option value="Branding">Branding</option>
              <option value="Video Marketing">Video Marketing</option>
              <option value="Full Pack">Full Pack</option>
            </select>
          </div>

          <Input
            label="Fecha Vencimiento del Plan"
            type="date"
            value={planFechaVencimiento}
            onChange={(e) => setPlanFechaVencimiento(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creando cliente...' : 'Crear e Inicializar Cliente'}
        </Button>
      </form>
    </div>
  );
}
