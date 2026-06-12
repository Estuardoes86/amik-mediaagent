# AMIK MediaAgent

Copiloto de medios pagos para AMIK GROUP. Diagnostica, recomienda y ejecuta cambios en campañas Meta Ads y Google Ads — con aprobación del equipo, con IA integrada.

## Stack

- **Frontend:** React 18 + Vite + Recharts
- **Backend:** Node.js + Express (ES Modules)
- **IA:** Claude Sonnet (Anthropic SDK)
- **APIs:** Meta Marketing API v19 + Google Ads API v16

---

## Instalación local

### 1. Clonar y configurar variables de entorno

```bash
# Clonar el repositorio
git clone https://github.com/amikgroup/mediaagent.git
cd amik-mediaagent

# Configurar backend
cp backend/.env.example backend/.env
# Edita backend/.env con tus credenciales reales

# Configurar frontend (opcional — los IDs también se pueden poner en Settings)
cp frontend/.env.example frontend/.env
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Correr en desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health

---

## Configuración de APIs

### Meta Ads API

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una app con permisos `ads_read` y `business_management`
3. Genera un **Long-Lived Access Token** (60 días) desde Graph API Explorer
4. Renueva el token antes de que expire con:
   ```
   GET https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&...
   ```
5. Pega el token en `backend/.env` → `META_ACCESS_TOKEN`

**Para producción:** Implementa un servidor de refresh automático o usa [Meta Business SDK](https://github.com/facebook/facebook-python-business-sdk).

### Google Ads API

1. Solicita un **Developer Token** en [Google Ads API Center](https://developers.google.com/google-ads/api/docs/get-started/dev-token)
2. Configura un proyecto OAuth2 en [Google Cloud Console](https://console.cloud.google.com/)
3. Genera credenciales OAuth2 con scope `https://www.googleapis.com/auth/adwords`
4. Obtén un refresh token y access token inicial
5. Configura en `backend/.env`:
   - `GOOGLE_ADS_DEVELOPER_TOKEN`
   - `GOOGLE_ADS_ACCESS_TOKEN`
   - `GOOGLE_ADS_MANAGER_ID` (si usas Manager Account)

**Para producción:** Usa `google-auth-library` para refresh automático de tokens.

### Anthropic (Claude AI)

1. Ve a [console.anthropic.com](https://console.anthropic.com/)
2. Genera una API key
3. Pega en `backend/.env` → `ANTHROPIC_API_KEY`

---

## IDs de cuentas por cliente

Hay dos formas de configurar los IDs de cuenta:

**Opción A: Variables de entorno (recomendado para producción)**
```env
# frontend/.env
VITE_UPSJB_META_ID=act_1234567890
VITE_UPSJB_GOOGLE_ID=9876543210
```

**Opción B: UI de Settings**
Ve a Settings → Clientes → Agrega los IDs directamente en la interfaz.

---

## Arquitectura del backend

```
backend/src/
├── index.js              # Entry point + Express app
├── middleware/
│   └── auth.js           # API key auth middleware
├── routes/
│   ├── meta.js           # Meta Ads endpoints
│   ├── google.js         # Google Ads endpoints
│   ├── ai.js             # Claude AI chat + analysis
│   ├── audit.js          # 3-tier audit engine
│   └── reports.js        # AI report generation
└── services/
    ├── metaService.js    # Meta Graph API wrapper + cache
    ├── googleService.js  # Google Ads API wrapper + cache
    └── auditService.js   # Audit logic (Tier 1/2/3)
```

### Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/meta/accounts` | Cuentas publicitarias Meta |
| GET | `/api/meta/campaigns?accountId=act_xxx` | Campañas + métricas |
| GET | `/api/meta/insights?accountId=act_xxx` | Insights completos |
| GET | `/api/google/campaigns?customerId=xxx` | Campañas Google |
| GET | `/api/google/keywords?customerId=xxx` | Keywords performance |
| POST | `/api/ai/chat` | Chat con Claude |
| POST | `/api/ai/analyze` | Análisis one-shot |
| POST | `/api/audit/run` | Ejecutar audit 3-tier |
| POST | `/api/reports/generate` | Generar reporte ejecutivo |

---

## Despliegue en producción

### Railway.app (recomendado)

```bash
# Instala Railway CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway init
railway up

# Configura las variables de entorno en el dashboard de Railway
```

### Render.com

1. Conecta el repositorio GitHub a Render
2. Crea un **Web Service** para el backend (Node.js)
3. Crea un **Static Site** para el frontend (Vite build)
4. Configura las variables de entorno en Render Dashboard
5. Configura el build command: `npm run build`
6. Configura el start command: `npm start`

### VPS / servidor propio

```bash
# Build
npm run build

# Instalar PM2 para gestión de procesos
npm install -g pm2

# Iniciar backend
pm2 start backend/src/index.js --name amik-mediaagent

# Sirve el frontend con Nginx
# Apunta nginx a frontend/dist/
```

---

## Seguridad

- **API keys:** Solo en variables de entorno del servidor, nunca en el frontend
- **CORS:** Configurado para solo aceptar requests del dominio del frontend
- **Rate limiting:** 200 requests/15min por IP
- **Auth middleware:** Activar `INTERNAL_API_KEY` en producción
- **Cache:** Responses de Meta y Google cacheados 5 minutos para reducir llamadas a API

---

## Desarrollo y extensión

### Agregar nuevo cliente
1. Settings → Clientes → Nuevo Cliente
2. O en `frontend/.env` agrega las variables `VITE_{CLIENTE}_META_ID` y `VITE_{CLIENTE}_GOOGLE_ID`

### Agregar nuevo módulo de audit
Edita `backend/src/services/auditService.js` y agrega una función de auditoría en el tier correspondiente.

### Personalizar el sistema prompt de Claude
Edita `backend/src/routes/ai.js` → constante `SYSTEM_PROMPT`.

---

## Créditos

Construido por **AMIK GROUP** para uso interno y de clientes.

- Inspirado en [MediaAgent by Bluenose](https://mediagent.bluenose.pe/)
- IA: Claude Sonnet by Anthropic
- Datos: Meta Marketing API + Google Ads API
