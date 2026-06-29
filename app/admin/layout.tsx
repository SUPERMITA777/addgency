import { getServerSession } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || session.rol !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-bg text-text">
      {/* Premium Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between p-6">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-serif text-accent tracking-widest font-bold">ADDGENCY</h1>
            <p className="text-[10px] text-muted tracking-widest uppercase font-mono mt-1">SuperAdmin Panel</p>
          </div>

          <nav className="space-y-1 font-sans text-sm">
            <Link
              href="/admin"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/clientes"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Clientes</span>
            </Link>
            <Link
              href="/admin/trabajos"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Trabajos</span>
            </Link>
            <Link
              href="/admin/tickets"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Tickets</span>
            </Link>
            <Link
              href="/admin/mensajes"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Mensajes</span>
            </Link>
            <Link
              href="/admin/usuarios"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-sm hover:bg-border transition duration-200"
            >
              <span>Usuarios</span>
            </Link>
          </nav>
        </div>

        <div className="border-t border-border pt-4">
          <div className="text-xs text-muted mb-2 font-mono">{session.email}</div>
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
            <h2 className="text-2xl font-serif font-medium">Bienvenido, {session.nombre}</h2>
            <p className="text-xs text-muted font-sans">Administra clientes, sube trabajos y gestiona tickets.</p>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
