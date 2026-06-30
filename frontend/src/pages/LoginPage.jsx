import React, { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage({ onLogin }) {
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
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg,#DCA145,#B8832E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 auto 16px'
          }}>A</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>AMIK MediaAgent</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>Dashboard de performance marketing</div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #F3F4F6', marginBottom: 28 }}/>

        <div style={{ fontSize: 13, color: '#374151', marginBottom: 20 }}>
          Inicia sesión con tu cuenta de Google autorizada
        </div>

        {/* Google Login Button */}
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

        <div style={{ marginTop: 24, fontSize: 11, color: '#9CA3AF' }}>
          Solo cuentas autorizadas por AMIK GROUP
        </div>
      </div>
    </div>
  );
}
