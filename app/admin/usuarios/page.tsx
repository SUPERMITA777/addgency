'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/Button';

interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'cliente';
  clienteId?: string;
  creadoEn?: any;
}

interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ rol: 'admin' | 'cliente'; clienteId: string }>({
    rol: 'cliente',
    clienteId: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await auth.currentUser?.getIdToken();

      // 1. Fetch clients list for dropdown selection
      const clientRes = await fetch('/api/clientes', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!clientRes.ok) throw new Error('Error al obtener la lista de clientes');
      const clientsData = await clientRes.json();
      setClientes(clientsData);

      // 2. Fetch all users from Firestore
      const usersSnapshot = await getDocs(collection(firestore, 'usuarios'));
      const usersList: UserProfile[] = [];
      usersSnapshot.forEach((doc) => {
        usersList.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsuarios(usersList);
    } catch (err: any) {
      console.error('Error fetching users data:', err);
      setError('Error al cargar los usuarios o clientes de la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          await user.getIdToken(true);
        } catch (e) {
          console.warn('Failed to force refresh token:', e);
        }
        fetchData();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleEditClick = (user: UserProfile) => {
    setEditingUid(user.uid);
    setEditForm({
      rol: user.rol,
      clienteId: user.clienteId || '',
    });
  };

  const handleSave = async (uid: string) => {
    setSaving(true);
    setError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const payload = {
        rol: editForm.rol,
        clienteId: editForm.rol === 'cliente' ? editForm.clienteId : '',
      };

      if (editForm.rol === 'cliente' && !editForm.clienteId) {
        throw new Error('Debes seleccionar un cliente para este usuario');
      }

      const res = await fetch(`/api/usuarios/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al actualizar el rol en el servidor');
      }

      // Update local state
      setUsuarios((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, ...payload } : u))
      );
      setEditingUid(null);
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Error al actualizar el rango del usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-serif text-accent">Administración de Usuarios</h3>
          <p className="text-xs text-muted">Gestiona el rango de acceso y la asignación a inquilinos de cada usuario.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs p-4 rounded-[2px] font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center font-mono text-xs text-muted py-20">Cargando base de datos de usuarios...</div>
      ) : (
        <div className="bg-surface border border-border rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-border bg-black/25 uppercase font-mono tracking-widest text-muted">
                <th className="p-4 font-normal">Nombre</th>
                <th className="p-4 font-normal">Email</th>
                <th className="p-4 font-normal">Rango / Rol</th>
                <th className="p-4 font-normal">Asignación Inquilino</th>
                <th className="p-4 font-normal text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {usuarios.map((user) => {
                const isEditing = editingUid === user.uid;
                const assignedClient = clientes.find((c) => c.id === user.clienteId);

                return (
                  <tr key={user.uid} className="hover:bg-white/[0.02] transition duration-150">
                    <td className="p-4 font-medium text-text">{user.nombre || 'Sin Nombre'}</td>
                    <td className="p-4 text-muted">{user.email}</td>
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          className="bg-bg border border-border text-xs px-2 py-1 text-text rounded-sm focus:border-accent outline-none"
                          value={editForm.rol}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              rol: e.target.value as 'admin' | 'cliente',
                            }))
                          }
                        >
                          <option value="admin">Administrador</option>
                          <option value="cliente">Cliente</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono ${
                            user.rol === 'admin'
                              ? 'bg-accent/15 text-accent border border-accent/30'
                              : 'bg-white/10 text-text/80 border border-white/10'
                          }`}
                        >
                          {user.rol === 'admin' ? 'Admin' : 'Cliente'}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        editForm.rol === 'cliente' ? (
                          <select
                            className="bg-bg border border-border text-xs px-2 py-1 text-text rounded-sm focus:border-accent outline-none max-w-[200px]"
                            value={editForm.clienteId}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                clienteId: e.target.value,
                              }))
                            }
                          >
                            <option value="">-- Seleccionar Cliente --</option>
                            {clientes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.empresa} ({c.nombre})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-muted italic">Acceso global</span>
                        )
                      ) : user.rol === 'admin' ? (
                        <span className="text-muted italic">Acceso global (Admin)</span>
                      ) : assignedClient ? (
                        <span className="font-mono text-accent">{assignedClient.empresa}</span>
                      ) : (
                        <span className="text-red-500/80 italic font-mono text-[10px]">Sin asignar</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => handleSave(user.uid)}
                            disabled={saving}
                            className="px-3 py-1 text-[10px] uppercase tracking-wider h-auto"
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => setEditingUid(null)}
                            disabled={saving}
                            className="px-3 py-1 text-[10px] uppercase tracking-wider h-auto"
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => handleEditClick(user)}
                          className="px-3 py-1 text-[10px] uppercase tracking-wider h-auto"
                        >
                          Editar Rango
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
