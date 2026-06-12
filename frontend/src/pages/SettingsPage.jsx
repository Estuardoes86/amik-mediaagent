import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function SettingsPage() {
  const { clients, addClient, showToast } = useApp();
  const [newClient, setNewClient] = useState({
    name: '', fullName: '', metaAccountId: '', googleCustomerId: '', currency: 'PEN'
  });
  const [showForm, setShowForm] = useState(false);

  function saveClient(e) {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    addClient(newClient);
    setNewClient({ name: '', fullName: '', metaAccountId: '', googleCustomerId: '', currency: 'PEN' });
    setShowForm(false);
    showToast(`✓ Cliente ${newClient.name} agregado`, 'success');
  }

  const Field = ({ label, id, value, onChange, placeholder, hint }) => (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 11, color: 'var(--text3)', letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </label>
      <input id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{hint}</div>}
    </div>
  );

  return (
    <div className="scroll-y" style={{ flex: 1, padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Configuración</h1>

      {/* API Keys notice */}
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        padding: 20, marginBottom: 24, borderRadius: 'var(--radius)'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Variables de entorno (backend)</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
          Las API keys se configuran en el archivo <code style={{ background: 'var(--bg)', padding: '1px 6px', fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>/backend/.env</code> — nunca en el frontend por seguridad.
        </div>
        <div style={{ marginTop: 12 }}>
          {[
            ['META_ACCESS_TOKEN', 'Token de acceso largo de Meta Ads', 'META'],
            ['GOOGLE_ADS_ACCESS_TOKEN', 'OAuth2 access token de Google Ads', 'GOOGLE'],
            ['GOOGLE_ADS_DEVELOPER_TOKEN', 'Developer token de Google Ads API', 'GOOGLE'],
            ['ANTHROPIC_API_KEY', 'API key de Anthropic para IA Copiloto', 'CLAUDE']
          ].map(([key, desc, tag]) => (
            <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ background: 'var(--bg3)', padding: '2px 8px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', borderRadius: 'var(--radius)', flexShrink: 0 }}>{tag}</span>
              <code style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent2)' }}>{key}</code>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>— {desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clients list */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Clientes ({clients.length})</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'CANCELAR' : '+ NUEVO CLIENTE'}
          </button>
        </div>

        {/* Add client form */}
        {showForm && (
          <form onSubmit={saveClient} style={{
            background: 'var(--bg2)', border: '0.5px solid var(--border)',
            padding: 20, marginBottom: 16, borderRadius: 'var(--radius)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="NOMBRE CORTO *" id="name" value={newClient.name}
                onChange={v => setNewClient(p => ({ ...p, name: v }))} placeholder="UPSJB" />
              <Field label="NOMBRE COMPLETO" id="fullName" value={newClient.fullName}
                onChange={v => setNewClient(p => ({ ...p, fullName: v }))} placeholder="Universidad Privada San Juan Bautista" />
              <Field label="META ADS ACCOUNT ID" id="metaId" value={newClient.metaAccountId}
                onChange={v => setNewClient(p => ({ ...p, metaAccountId: v }))}
                placeholder="act_000000000000" hint="Formato: act_ + número de cuenta" />
              <Field label="GOOGLE ADS CUSTOMER ID" id="googleId" value={newClient.googleCustomerId}
                onChange={v => setNewClient(p => ({ ...p, googleCustomerId: v }))}
                placeholder="1234567890" hint="Sin guiones — solo dígitos" />
            </div>
            <button type="submit" className="btn btn-success">GUARDAR CLIENTE</button>
          </form>
        )}

        {/* Clients list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {clients.map(c => (
            <div key={c.id} style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              padding: '14px 16px', borderRadius: 'var(--radius)',
              display: 'flex', gap: 16, alignItems: 'center'
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: c.metaAccountId ? 'var(--green)' : 'var(--text3)', flexShrink: 0
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  Meta: {c.metaAccountId || <span style={{ color: 'var(--yellow)' }}>sin configurar</span>}
                  {' · '}
                  Google: {c.googleCustomerId || <span style={{ color: 'var(--yellow)' }}>sin configurar</span>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: c.metaAccountId || c.googleCustomerId ? 'var(--green)' : 'var(--text3)' }}>
                {c.metaAccountId || c.googleCustomerId ? '✓ conectado' : 'sin cuentas'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deploy info */}
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        padding: 20, borderRadius: 'var(--radius)'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Instrucciones de despliegue</div>
        {[
          ['1. Clonar y configurar', 'cp backend/.env.example backend/.env\n# Edita backend/.env con tus API keys'],
          ['2. Instalar dependencias', 'npm install'],
          ['3. Correr en desarrollo', 'npm run dev\n# Frontend: http://localhost:5173\n# Backend: http://localhost:3001'],
          ['4. Build para producción', 'npm run build\n# Frontend compilado en frontend/dist/\n# Sirve el backend con: npm start'],
          ['5. Variables en producción', '# Setea las mismas variables de .env en tu servidor\n# Render.com, Railway, o VPS propio']
        ].map(([title, code]) => (
          <div key={title} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: 1, marginBottom: 4 }}>{title}</div>
            <pre style={{ background: 'var(--bg)', padding: '8px 12px', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)', overflowX: 'auto' }}>{code}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
