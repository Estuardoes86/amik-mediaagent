import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { aiApi } from '../lib/api.js';

const QUICK_PROMPTS = [
  '¿Cuál es el principal problema de esta cuenta?',
  '¿Por qué puede estar subiendo el CPL?',
  '¿Qué ad sets debería consolidar primero?',
  '¿Cómo mejorar la calidad del tracking?',
  'Dame las 3 acciones de mayor impacto esta semana',
  '¿Qué creativos pausaría hoy?'
];

function Message({ role, content, isTyping }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      flexDirection: role === 'user' ? 'row-reverse' : 'row'
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 'var(--radius)',
        background: role === 'user' ? 'var(--bg3)' : 'var(--accent)',
        color: role === 'user' ? 'var(--text2)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        border: role === 'user' ? '0.5px solid var(--border2)' : 'none'
      }}>
        {role === 'user' ? 'TÚ' : 'AG'}
      </div>
      <div style={{
        background: role === 'user' ? 'var(--bg3)' : 'var(--bg2)',
        border: '0.5px solid var(--border)',
        padding: '12px 16px',
        maxWidth: '75%',
        fontSize: 13,
        lineHeight: 1.7,
        borderRadius: 'var(--radius)',
        whiteSpace: 'pre-wrap'
      }}>
        {isTyping ? (
          <div className="typing-dots">
            <span /><span /><span />
          </div>
        ) : (
          content.split('**').map((part, i) =>
            i % 2 === 1
              ? <strong key={i}>{part}</strong>
              : part.split('`').map((p, j) =>
                  j % 2 === 1
                    ? <code key={j} style={{ background: 'var(--bg)', padding: '1px 6px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent2)' }}>{p}</code>
                    : p
                )
          )
        )}
      </div>
    </div>
  );
}

export default function AiPage() {
  const { activeClient } = useApp();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hola. Soy el copiloto de IA de AMIK MediaAgent.\n\nTengo contexto sobre las campañas de ${activeClient.name}. Pregúntame lo que necesites: análisis de CPL, diagnóstico de estructura, tracking, creativos, o cualquier cosa sobre performance de medios pagos.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update greeting when client changes
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `Cliente activo: **${activeClient.name}**\n\nListo para analizar campañas, tracking, estructura de ad sets, creativos o cualquier métrica. ¿Qué quieres revisar?`
    }]);
  }, [activeClient.id]);

  async function send(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);
    setLoading(true);

    try {
      const clientContext = {
        clientName: activeClient.name,
        metaAccountId: activeClient.metaAccountId,
        googleCustomerId: activeClient.googleCustomerId,
        currency: activeClient.currency
      };

      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await aiApi.chat(apiMessages, clientContext);
      const reply = res.data.content;

      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: reply }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Error al conectar con el servidor. Verifica que el backend esté corriendo.' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Quick prompts */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 20px', overflowX: 'auto',
        borderBottom: '0.5px solid var(--border)', flexShrink: 0, flexWrap: 'nowrap'
      }}>
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => send(p)}
            disabled={loading}
            style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border2)',
              color: 'var(--text2)', padding: '5px 14px', fontSize: 11,
              cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: 'var(--radius)',
              transition: 'all 0.15s', flexShrink: 0
            }}
            onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.target.style.borderColor = 'var(--border2)'}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="scroll-y" style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} isTyping={m.isTyping} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '0.5px solid var(--border)',
        padding: 16,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end',
        background: 'var(--bg)',
        flexShrink: 0
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Pregunta sobre campañas de ${activeClient.name}... (Enter para enviar, Shift+Enter para nueva línea)`}
          rows={2}
          style={{ flex: 1, resize: 'none', lineHeight: 1.5 }}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0 }}
        >
          {loading ? <span className="spinner" /> : 'ENVIAR'}
        </button>
      </div>
    </div>
  );
}
