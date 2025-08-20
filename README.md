# Shipping Frontend (React + Vite)

Frontend listo para consumir el backend Flask desplegado en Render.

## 🔧 Variables
- `VITE_API_URL` → URL base del backend (por defecto apunta a tu Render).
  - Ejemplo: `https://shipping-backend-kgm5.onrender.com/api`

Crea un archivo `.env` en la raíz si quieres cambiarlo:
```
VITE_API_URL=https://TU-BACKEND/api
```

## ▶️ Correr en local
> Si no tienes permisos de consola, puedes omitir esto y subir directo a GitHub/Vercel.
```bash
npm i
npm run dev
```

## 🚀 Deploy en Vercel
1. Sube esta carpeta a un repo de GitHub.
2. En Vercel:
   - **New Project** → selecciona el repo.
   - Build Command: `vite build` (automático)
   - Output Directory: `dist` (automático)
   - Env var: `VITE_API_URL=https://shipping-backend-kgm5.onrender.com/api`
3. En Render, configura `FRONTEND_ORIGIN` con la URL que te da Vercel, p.ej. `https://tuapp.vercel.app`

## 🧱 Funcionalidades
- Login (email o usuario) + token en `localStorage`.
- Listado y creación de Órdenes.
- Detalle de Orden con edición inline de líneas.
- Cálculo de totales.
- Reportes: listado, creación y vista previa de JSON.
- **Imprimir** orden o reporte con `Ctrl+P` (estilos de impresión incluidos).
- Actualización “en vivo” mediante **auto-refresco** cada 5s.

## 📁 Estructura
```
src/
  components/
    Login.jsx
    Orders.jsx
    OrderDetail.jsx
    Reports.jsx
  api.js
  auth.js
  App.jsx
  main.jsx
  styles.css
index.html
vite.config.js
package.json
```

## 🔐 Notas de seguridad
- El token se envía como `Authorization: Bearer ...`.
- Asegúrate de tener `FRONTEND_ORIGIN` configurado en Render para permitir CORS desde tu frontend en producción.
- El endpoint `/register` solo aceptará registros abiertos si `ALLOW_OPEN_SIGNUP=true` en tu backend.
