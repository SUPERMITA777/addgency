import Link from 'next/link';

export default function PublicLanding() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-bg text-text p-6 md:p-12 selection:bg-accent selection:text-bg">
      {/* Navigation Header */}
      <header className="flex justify-between items-center max-w-7xl mx-auto w-full border-b border-border/40 pb-6">
        <h1 className="text-2xl font-serif font-bold tracking-widest text-accent uppercase">ADDGENCY</h1>
        <Link
          href="/login"
          className="px-5 py-2 border border-border text-xs font-mono tracking-widest uppercase hover:border-accent hover:text-accent transition duration-300 rounded-[2px]"
        >
          Acceso Clientes
        </Link>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto w-full my-auto py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 text-left">
          <div className="inline-flex items-center space-x-2 border border-accent/20 bg-accent/5 px-3 py-1 rounded-[2px]">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-medium">
              Agencia de Diseño & Marketing Digital
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-serif font-light leading-tight">
            Elevamos la presencia visual de <span className="text-accent italic font-normal">marcas líderes</span>.
          </h2>

          <p className="text-muted text-sm md:text-base max-w-lg font-sans font-light leading-relaxed">
            ADDGENCY combina dirección de arte, marketing orientado a la conversión y soluciones interactivas premium para posicionar tu marca en el siguiente nivel digital.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/login"
              className="px-8 py-3.5 bg-accent text-bg text-xs uppercase tracking-widest font-sans font-semibold hover:bg-accent-dim transition duration-300 rounded-[4px] shadow-lg shadow-accent/5"
            >
              Iniciar Proyecto
            </Link>
            <a
              href="#servicios"
              className="px-8 py-3.5 border border-border text-xs uppercase tracking-widest font-sans font-medium hover:border-accent transition duration-300 rounded-[4px]"
            >
              Ver Servicios
            </a>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="servicios" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-surface border border-border p-6 rounded-sm space-y-3 hover:border-accent/40 transition duration-300">
            <span className="text-2xl text-accent font-serif font-light">01</span>
            <h4 className="font-serif text-lg font-medium text-text">Branding Premium</h4>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Diseño de identidad visual integral, manuales de marca y papelería exclusiva de alta gama.
            </p>
          </div>

          <div className="bg-surface border border-border p-6 rounded-sm space-y-3 hover:border-accent/40 transition duration-300">
            <span className="text-2xl text-accent font-serif font-light">02</span>
            <h4 className="font-serif text-lg font-medium text-text">Social Media</h4>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Planificación visual, dirección artística y producción de contenido premium de alta conversión.
            </p>
          </div>

          <div className="bg-surface border border-border p-6 rounded-sm space-y-3 hover:border-accent/40 transition duration-300">
            <span className="text-2xl text-accent font-serif font-light">03</span>
            <h4 className="font-serif text-lg font-medium text-text">Video Marketing</h4>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Dirección, rodaje y postproducción de videos comerciales y cinematográficos optimizados para redes.
            </p>
          </div>

          <div className="bg-surface border border-border p-6 rounded-sm space-y-3 hover:border-accent/40 transition duration-300">
            <span className="text-2xl text-accent font-serif font-light">04</span>
            <h4 className="font-serif text-lg font-medium text-text">Entornos Web</h4>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Diseño UX/UI interactivo a medida y desarrollo Frontend de alta fidelidad y performance.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="max-w-7xl mx-auto w-full text-center border-t border-border/40 pt-6 text-[10px] text-muted font-mono uppercase tracking-wider flex flex-col sm:flex-row justify-between gap-4">
        <div>&copy; {new Date().getFullYear()} ADDGENCY. Todos los derechos reservados.</div>
        <div className="flex justify-center space-x-6">
          <a href="https://github.com/SUPERMITA777/addgency" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition duration-200">
            GitHub Repo
          </a>
          <span>&bull;</span>
          <Link href="/login" className="hover:text-accent transition duration-200">
            Client Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
