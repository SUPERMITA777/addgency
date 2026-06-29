export default function ClienteDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Entregas Realizadas</span>
          <h3 className="text-3xl font-serif text-accent">8</h3>
        </div>

        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">En Revisión</span>
          <h3 className="text-3xl font-serif text-accent">2</h3>
        </div>

        <div className="bg-surface border border-border p-6 rounded-sm">
          <span className="text-xs text-muted uppercase font-mono tracking-widest block mb-2">Tickets de Consulta</span>
          <h3 className="text-3xl font-serif text-accent">1</h3>
        </div>
      </div>

      <div className="bg-surface border border-border p-6 rounded-sm">
        <h3 className="text-lg font-serif mb-4 text-text">Resumen del Proyecto</h3>
        <p className="text-xs text-muted font-sans leading-relaxed">
          Tus archivos listos para descarga estarán disponibles en la pestaña "Mis Trabajos". Si deseas solicitar modificaciones o aprobaciones, puedes abrir una consulta.
        </p>
      </div>
    </div>
  );
}
