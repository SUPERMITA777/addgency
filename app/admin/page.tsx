export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Clientes Activos</span>
          <h3 className="text-3xl font-serif text-accent">12</h3>
        </div>

        {/* Card 2 */}
        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Trabajos en Revisión</span>
          <h3 className="text-3xl font-serif text-accent">5</h3>
        </div>

        {/* Card 3 */}
        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Tickets Abiertos</span>
          <h3 className="text-3xl font-serif text-accent">3</h3>
        </div>
      </div>

      <div className="bg-surface border border-border p-6 rounded-sm">
        <h3 className="text-lg font-serif mb-4 text-text">Actividad Reciente</h3>
        <p className="text-xs text-muted font-sans">Todos los sistemas operativos y operando normalmente.</p>
      </div>
    </div>
  );
}
