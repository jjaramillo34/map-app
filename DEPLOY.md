# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar Power Solar Map en Vercel de manera rápida y sencilla.

## 🚀 Despliegue Rápido

### Opción 1: Desde GitHub (Recomendado)

1. **Sube tu código a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <tu-repositorio-github>
   git push -u origin main
   ```

2. **Conecta con Vercel**:
   - Ve a [vercel.com](https://vercel.com) e inicia sesión
   - Haz clic en "Add New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es una aplicación React

3. **Configura Variables de Entorno**:
   - En la página de configuración del proyecto, ve a "Environment Variables"
   - Agrega las siguientes variables:
     - `REACT_APP_MAPBOX_TOKEN` = `tu_token_de_mapbox`
     - `REACT_APP_OPENAI_API_KEY` = `tu_api_key` (opcional)
     - `REACT_APP_ADMIN_PASSWORD_HASH` = `tu_hash` (opcional)

4. **Despliega**:
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará tu aplicación automáticamente
   - Tu app estará disponible en `https://powersolarpr.vercel.app/`

### Opción 2: Desde la Terminal (CLI)

1. **Instala Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Inicia sesión**:
   ```bash
   vercel login
   ```

3. **Despliega**:
   ```bash
   vercel
   ```
   
   Sigue las instrucciones:
   - ¿Quieres sobrescribir el proyecto? → `Y`
   - ¿Qué directorio? → `.` (presiona Enter)
   - ¿Quieres modificar settings? → `N` (a menos que quieras cambiar algo)

4. **Configura Variables de Entorno**:
   ```bash
   vercel env add REACT_APP_MAPBOX_TOKEN
   vercel env add REACT_APP_OPENAI_API_KEY
   vercel env add REACT_APP_ADMIN_PASSWORD_HASH
   ```

5. **Despliega a Producción**:
   ```bash
   vercel --prod
   ```

## 📝 Configuración del Proyecto

El archivo `vercel.json` ya está configurado con:

- ✅ Routing para React Router (SPA)
- ✅ Headers de caché optimizados
- ✅ Configuración de variables de entorno
- ✅ Build command y output directory

## 🔄 Despliegues Automáticos

Una vez conectado con GitHub:

- **Cada push a `main`** → Despliegue automático a producción
- **Pull Requests** → Preview deployments automáticos
- **Ramas** → Preview deployments para testing

## 🌍 Dominio Personalizado

Para usar un dominio personalizado:

1. Ve a tu proyecto en Vercel → Settings → Domains
2. Agrega tu dominio
3. Sigue las instrucciones para configurar DNS

## 🔐 Variables de Entorno

### Requeridas:
- `REACT_APP_MAPBOX_TOKEN` - Token de Mapbox (obligatorio)

### Opcionales:
- `REACT_APP_OPENAI_API_KEY` - Para generación de contenido con IA
- `REACT_APP_ADMIN_PASSWORD_HASH` - Hash de contraseña para admin panel

### Cómo generar el hash de contraseña:

Abre la consola del navegador en tu app local y ejecuta:

```javascript
const encoder = new TextEncoder();
const data = encoder.encode("tu-contraseña-segura");
crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Hash:', hashHex);
});
```

## 🐛 Solución de Problemas

### Error: "Build failed"
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel dashboard

### Error: "Environment variables not found"
- Asegúrate de agregar las variables en Vercel dashboard
- Verifica que los nombres sean exactos (case-sensitive)

### Error: "404 on routes"
- Verifica que `vercel.json` tenga la configuración de rewrites
- Asegúrate de que todas las rutas redirijan a `index.html`

### Error: "Mapbox token invalid"
- Verifica que el token esté correctamente configurado
- Asegúrate de que el token tenga los permisos necesarios

## 📊 Monitoreo

Vercel incluye:
- Analytics (ya integrado con `@vercel/analytics`)
- Speed Insights (ya integrado con `@vercel/speed-insights`)
- Logs de build y runtime
- Métricas de rendimiento

## 🔄 Actualizar Despliegue

Para actualizar la aplicación:

1. Haz cambios en tu código local
2. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```
3. Vercel desplegará automáticamente los cambios

O manualmente:
```bash
vercel --prod
```

## 📚 Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Guía de React en Vercel](https://vercel.com/docs/frameworks/react)
- [Variables de Entorno en Vercel](https://vercel.com/docs/environment-variables)

---

**¡Tu aplicación está lista para desplegarse!** 🎉

