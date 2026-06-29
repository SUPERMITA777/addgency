'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // Verify the role on our mock authentication middleware or database
      // Fetch /api/auth/me or similar, or check Firestore 'usuarios' collection directly
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo verificar el rol del usuario.');
      }

      // Force client SDK to refresh ID token claims now that they are synced on the server
      await userCredential.user.getIdToken(true);

      const session = await response.json();

      if (session.rol === 'admin') {
        router.push('/admin');
      } else {
        router.push('/cliente');
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Credenciales inválidas o error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text p-6">
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-accent tracking-wide mb-2">ADDGENCY</h1>
          <p className="text-xs text-muted font-sans uppercase tracking-widest">Acceso a la plataforma</p>
        </div>

        {error && (
          <div className="bg-danger/20 border border-danger text-text text-sm p-3 mb-6 rounded-sm font-mono text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex flex-col space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted font-sans">Email</label>
            <input
              type="email"
              required
              className="w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted font-sans">Contraseña</label>
            <input
              type="password"
              required
              className="w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-bg text-sm uppercase tracking-widest font-sans font-semibold hover:bg-accent-dim transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
