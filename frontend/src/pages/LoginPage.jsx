import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../lib/api.js';

export default function LoginPage({ onLogin, onLocalLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError('Ingresa correo y contraseña'); return; }
    setError(''); setLoading(true);
    try {
      const { data } = await authApi.login(email.trim(), password);
      if (data.token) {
        localStorage.setItem('amik_token', data.token);
        onLocalLogin(data.user);
      } else {
        setError('Respuesta inválida del servidor');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8F9FA', fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '48px 40px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)', textAlign: 'center',
        width: 380, border: '1px solid #E5E7EB'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg,#DCA145,#B8832E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 auto 16px'
          }}>A</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>AMIK MediaAgent</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>Dashboard de performance marketing</div>
        </div>

        <div style={{ borderTop: '1px solid #F3F4F6', marginBottom: 24 }}/>

        {/* Google Login */}
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
          Equipo AMIK · inicia con Google
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={onLogin}
            onError={() => console.error('Login failed')}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
            locale="es"
          />
        </div>

        {/* Separador "o" */}
        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'24px 0 20px' }}>
          <div style={{ flex:1, height:1, background:'#E5E7EB' }}/>
          <span style={{ fontSize:11, color:'#9CA3AF', fontWeight:600 }}>O CON TU USUARIO</span>
          <div style={{ flex:1, height:1, background:'#E5E7EB' }}/>
        </div>

        {/* Formulario usuario + contraseña */}
        <div style={{ textAlign:'left' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={onKey}
            placeholder="correo@ejemplo.com"
            autoComplete="username"
            style={{
              width:'100%', padding:'11px 14px', marginBottom:10, fontSize:13,
              border:'1px solid #E5E7EB', borderRadius:8, boxSizing:'border-box',
              outline:'none', fontFamily:'inherit',
            }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={onKey}
            placeholder="Contraseña"
            autoComplete="current-password"
            style={{
              width:'100%', padding:'11px 14px', marginBottom:12, fontSize:13,
              border:'1px solid #E5E7EB', borderRadius:8, boxSizing:'border-box',
              outline:'none', fontFamily:'inherit',
            }}
          />
          {error && (
            <div style={{ fontSize:12, color:'#DC2626', marginBottom:12, textAlign:'center' }}>{error}</div>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width:'100%', padding:'11px', fontSize:13, fontWeight:700,
              color:'#fff', border:'none', borderRadius:8, cursor: loading?'default':'pointer',
              background: loading ? '#C9A15E' : 'linear-gradient(135deg,#DCA145,#B8832E)',
              fontFamily:'inherit', letterSpacing:'0.3px',
            }}
          >
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </div>

        <div style={{ marginTop: 22, fontSize: 11, color: '#9CA3AF' }}>
          Solo cuentas autorizadas por AMIK GROUP
        </div>
      </div>
    </div>
  );
}
