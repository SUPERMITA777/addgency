import { Timestamp } from 'firebase/firestore';

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  empresa: string;
  subdominio: string;           // ej: "pixelstudio" → pixelstudio.tuagencia.com
  planActual: string;           // ej: "Social Media", "Branding", etc.
  planEstado: 'vigente' | 'vencido' | 'pausado';
  planFechaVencimiento: Timestamp;
  creadoEn: Timestamp;
  activo: boolean;
}

export interface Trabajo {
  id: string;
  clienteId: string;
  titulo: string;
  descripcion: string;
  tipo: 'imagen' | 'video' | 'pdf';
  estado: 'en_revision' | 'aprobado' | 'rechazado' | 'en_modificacion';
  archivoUrl: string;           // URL interna (nunca expuesta al cliente directamente)
  archivoBucket: 'firebase' | 'backblaze';
  archivoPath: string;          // Path dentro del bucket
  marcaDeAgua: boolean;         // Si aplica marca de agua al servir
  version: number;              // Número de versión del trabajo
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
  creadoPor: string;            // uid del admin
}

export interface Ticket {
  id: string;
  clienteId: string;
  trabajoId?: string;           // Opcional: ticket puede estar asociado a un trabajo
  tipo: 'consulta' | 'pedido' | 'modificacion' | 'aprobacion' | 'rechazo';
  estado: 'abierto' | 'en_proceso' | 'resuelto';
  mensaje: string;
  respuesta?: string;
  creadoEn: Timestamp;
  respondidoEn?: Timestamp;
  creadoPor: 'admin' | 'cliente';
}

export interface Mensaje {
  id: string;
  clienteId: string;
  de: 'admin' | 'cliente';
  texto: string;
  leido: boolean;
  creadoEn: Timestamp;
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
}

export interface Usuario {
  uid: string;
  email: string;
  rol: 'admin' | 'cliente';
  clienteId?: string;           // Solo si rol=cliente
  nombre: string;
  creadoEn: Timestamp;
}
