import { collection, CollectionReference, DocumentData } from 'firebase/firestore';
import { firestore } from './client';
import { Cliente, Trabajo, Ticket, Mensaje, Usuario } from '@/types';

export const COLLECTIONS = {
  CLIENTES: 'clientes',
  TRABAJOS: 'trabajos',
  TICKETS: 'tickets',
  MENSAJES: 'mensajes',
  USUARIOS: 'usuarios',
} as const;

// Helper to cast collections on the client side
const createCollection = <T = DocumentData>(path: string) => {
  return collection(firestore, path) as CollectionReference<T>;
};

export const clientesCol = () => createCollection<Cliente>(COLLECTIONS.CLIENTES);
export const trabajosCol = () => createCollection<Trabajo>(COLLECTIONS.TRABAJOS);
export const ticketsCol = () => createCollection<Ticket>(COLLECTIONS.TICKETS);
export const mensajesCol = () => createCollection<Mensaje>(COLLECTIONS.MENSAJES);
export const usuariosCol = () => createCollection<Usuario>(COLLECTIONS.USUARIOS);
export type { Cliente, Trabajo, Ticket, Mensaje, Usuario };
