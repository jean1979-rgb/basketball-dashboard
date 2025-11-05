# Dashboard en vivo — Baloncesto

Proyecto Next.js + Tailwind que obtiene datos públicos (ESPN) y calcula proyecciones de Totales y Spread. Interfaz en español.

## Requisitos
- Node.js 18+

## Ejecutar en local
1. Instalar dependencias:
   ```
   npm install
   ```
2. Levantar servidor en modo desarrollo:
   ```
   npm run dev
   ```
3. Abrir http://localhost:3000

## Deploy en Vercel (sencillo)
1. Crear cuenta en https://vercel.com
2. Subir el ZIP o conectar el repositorio GitHub
3. Vercel detectará Next.js y desplegará automáticamente.

## Notas
- La app usa la API pública de ESPN. Si detectas bloqueos desde Vercel, considera usar un proveedor proxy o RapidAPI.
- Si quieres que integre tu propia API de odds o datos avanzados, dime y lo conecto.
