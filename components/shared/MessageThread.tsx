'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase/client';
import { Button } from '../ui/Button';

interface Message {
  id: string;
  clienteId: string;
  de: 'admin' | 'cliente';
  texto: string;
  leido: boolean;
  creadoEn: any;
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
}

interface MessageThreadProps {
  clienteId: string;
  rol: 'admin' | 'cliente';
}

export const MessageThread: React.FC<MessageThreadProps> = ({ clienteId, rol }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ url: string; nombre: string; tipo: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Subscribe to messages thread in real-time
    const q = query(
      collection(firestore, 'mensajes'),
      where('clienteId', '==', clienteId),
      orderBy('creadoEn', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      setMessages(msgs);

      // 2. Mark incoming messages from the counterparty as read
      msgs.forEach(async (msg) => {
        if (msg.de !== rol && !msg.leido) {
          try {
            await updateDoc(doc(firestore, 'mensajes', msg.id), { leido: true });
          } catch (err) {
            console.error('Error marking message as read:', err);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [clienteId, rol]);

  useEffect(() => {
    // Autoscroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('clienteId', clienteId);
    formData.append('archivo', file);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/mensajes/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Fallo al subir el archivo adjunto');
      }

      const data = await res.json();
      setAttachedFile({
        url: data.url,
        nombre: data.nombre,
        tipo: data.tipo,
      });
    } catch (err) {
      console.error(err);
      alert('Error al adjuntar archivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    try {
      const msgPayload: Partial<Message> = {
        clienteId,
        de: rol,
        texto: inputText.trim(),
        leido: false,
        creadoEn: serverTimestamp(),
        ...(attachedFile ? {
          archivoUrl: attachedFile.url,
          archivoNombre: attachedFile.nombre,
          archivoTipo: attachedFile.tipo,
        } : {}),
      };

      await addDoc(collection(firestore, 'mensajes'), msgPayload);
      
      // Reset
      setInputText('');
      setAttachedFile(null);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('No se pudo enviar el mensaje.');
    }
  };

  return (
    <div className="flex flex-col h-[65vh] bg-surface border border-border rounded-sm overflow-hidden">
      {/* Messages list */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-muted font-sans font-light py-20">
            No hay mensajes en este chat. Inicia la conversación.
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.de === rol;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-sm p-4 text-sm font-sans ${
                    isOwn
                      ? 'bg-accent text-bg'
                      : 'bg-border/30 text-text border border-border/80'
                  }`}
                >
                  {/* Message text */}
                  {msg.texto && <p className="leading-relaxed break-words">{msg.texto}</p>}

                  {/* Render attachment if exists */}
                  {msg.archivoUrl && (
                    <div className={`mt-3 pt-3 border-t ${isOwn ? 'border-bg/20' : 'border-border/60'}`}>
                      {msg.archivoTipo?.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.archivoUrl}
                          alt={msg.archivoNombre}
                          className="max-w-full rounded-sm max-h-48 object-cover shadow-sm cursor-zoom-in"
                          onClick={() => window.open(msg.archivoUrl, '_blank')}
                        />
                      ) : msg.archivoTipo?.startsWith('audio/') ? (
                        <audio src={msg.archivoUrl} controls className="w-full max-w-xs h-8" />
                      ) : (
                        <a
                          href={msg.archivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-2 text-xs font-mono underline hover:opacity-80 ${
                            isOwn ? 'text-bg' : 'text-accent'
                          }`}
                        >
                          <span className="text-sm">&#128196;</span>
                          <span className="truncate max-w-xs">{msg.archivoNombre || 'Ver archivo'}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Time and read status */}
                  <div className={`flex justify-end items-center space-x-1.5 mt-1.5 text-[9px] font-mono leading-none ${
                    isOwn ? 'text-bg/60' : 'text-muted'
                  }`}>
                    <span>
                      {msg.creadoEn
                        ? new Date(msg.creadoEn.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                    {isOwn && (
                      <span className="text-[10px]">
                        {msg.leido ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-bg/25 flex items-center space-x-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,application/pdf,audio/*"
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 border border-border text-muted hover:text-text rounded-sm hover:border-accent transition duration-200 disabled:opacity-50"
        >
          {uploading ? '...' : '📎'}
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            className="w-full"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={attachedFile ? `Adjunto: ${attachedFile.nombre}` : 'Escribe tu mensaje...'}
            disabled={uploading}
          />
          {attachedFile && (
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="absolute right-3 text-danger font-mono text-sm"
            >
              &times;
            </button>
          )}
        </div>

        <Button type="submit" disabled={uploading || (!inputText.trim() && !attachedFile)}>
          Enviar
        </Button>
      </form>
    </div>
  );
};
export default MessageThread;
