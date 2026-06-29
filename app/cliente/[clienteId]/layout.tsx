import { getServerSession } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { adminFirestore } from '@/lib/firebase/admin';
import Link from 'next/link';

export default async function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { clienteId: string };
}) {
  const session = await getServerSession();

  // Protect route
  if (!session) {
    redirect('/login');
  }

  // Clients can only access their own tenant space
  if (session.rol !== 'admin' && session.clienteId !== params.clienteId) {
    redirect('/login');
  }

  const { clienteId } = params;

  // Fetch client details from Firestore
  const clienteDoc = await adminFirestore.collection('clientes').doc(clienteId).get();
  if (!clienteDoc.exists) {
    redirect('/');
  }

  const cliente = clienteDoc.data();

  return (
    <div className="flex min-h-screen bg-bg text-text">
      {/* Premium Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between p-6">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-serif text-accent tracking-widest font-bold">ADDGENCY</h1>
            <p className="text-[10px] text-muted tracking-widest uppercase font-mono mt-1">{cliente?.empresa || 'Cliente'}</p>
          </div>

          <nav className="space-y-1 font-sans text-sm">
            <Link
              href="/"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Escritorio</span>
            </Link>
            <Link
              href="/trabajos"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Mis Trabajos</span>
            </Link>
            <Link
              href="/tickets"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Consultas</span>
            </Link>
            <Link
              href="/mensajes"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Mensajes</span>
            </Link>
          </nav>
        </div>

        <div className="border-t border-border pt-4">
          <div className="text-xs text-muted mb-1 font-sans font-light">Plan: {cliente?.planActual || 'Sin plan'}</div>
          <div className="text-xs text-muted mb-4 font-sans font-light">
            Estado:{' '}
            <span
              className={
                cliente?.planEstado === 'vigente'
                  ? 'text-success font-mono font-medium'
                  : cliente?.planEstado === 'pausado'
                  ? 'text-warning font-mono font-medium'
                  : 'text-danger font-mono font-medium'
              }
            >
              {cliente?.planEstado || 'vencido'}
            </span>
          </div>
          <Link
            href="/login"
            className="block text-center text-xs border border-border py-2 text-text hover:border-danger transition duration-200 font-sans uppercase tracking-wider"
          >
            Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center border-b border-border pb-6 mb-8">
          <div>
            <h2 className="text-2xl font-serif font-medium">Panel de Control</h2>
            <p className="text-xs text-muted font-sans">Visualiza tus contenidos aprobados, pendientes o descarga entregables.</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-serif font-medium">{cliente?.nombre}</div>
            <div className="text-xs text-muted font-mono">{session.email}</div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
