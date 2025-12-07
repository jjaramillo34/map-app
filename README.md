# Power Solar Map

Una aplicación web interactiva para visualizar y analizar datos de clientes de energía solar en Puerto Rico. Desarrollado con React, Mapbox GL JS, y tecnologías modernas de visualización de datos.

🌐 **Live Demo**: [https://powersolarpr.vercel.app/](https://powersolarpr.vercel.app/)

## 🌟 Características

- **Mapas Interactivos**: Visualización de datos geográficos con Mapbox GL JS
  - Mapa interactivo con clusters
  - Mapa de calor (heatmap)
  - Vista 3D con edificios
  - Mapa de clusters avanzado

- **Análisis por Municipios**: 
  - Filtrado y búsqueda por municipio
  - Páginas detalladas para cada municipio
  - Estadísticas y métricas en tiempo real

- **Analytics Avanzado**:
  - Análisis con Machine Learning (K-Means, Regresión Lineal, Árboles de Decisión)
  - Detección de anomalías
  - Análisis de correlaciones
  - Segmentación de mercado
  - Visualizaciones interactivas con Recharts
  - Exportación a PDF y CSV

- **Panel de Administración**:
  - Gestión de contenido de municipios
  - Generación de descripciones con IA (OpenAI)
  - Protección con contraseña encriptada

- **Diseño Moderno**:
  - Interfaz responsive con Tailwind CSS
  - Iconos con Lucide React
  - Animaciones y transiciones suaves

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 14+ y npm
- Token de Mapbox (obtener en [Mapbox](https://account.mapbox.com/access-tokens/))
- (Opcional) API Key de OpenAI para el panel de administración

### Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd map-app
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:

Crear un archivo `.env` en la raíz del proyecto:

```env
REACT_APP_MAPBOX_TOKEN=tu_token_de_mapbox
REACT_APP_OPENAI_API_KEY=tu_api_key_de_openai (opcional)
REACT_APP_ADMIN_PASSWORD_HASH=hash_de_tu_contraseña (opcional)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/powersolarpr (requerido para almacenar datos)
```

**Nota**: Para MongoDB, ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) y crea un cluster gratuito. 
Ver `MONGODB_SETUP.md` para instrucciones detalladas.

Para generar un hash de contraseña, puedes usar la función en el navegador:
```javascript
const encoder = new TextEncoder();
const data = encoder.encode("tu-contraseña");
crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log(hashHex);
});
```

4. Iniciar el servidor de desarrollo:
```bash
npm start
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
map-app/
├── public/
│   ├── data/              # Datos públicos (CSV, JSON)
│   └── index.html
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── Layout.js
│   │   ├── AdminProtectedRoute.js
│   │   └── MunicipalityAnalytics.js
│   ├── pages/             # Páginas de la aplicación
│   │   ├── LandingPage.js
│   │   ├── Mapa.js
│   │   ├── Municipios.js
│   │   ├── MunicipioDetail.js
│   │   ├── ClusterMap.js
│   │   ├── HeatMap.js
│   │   ├── Map3D.js
│   │   ├── AnalyticsPage.js
│   │   ├── AdminLogin.js
│   │   ├── AdminDashboard.js
│   │   ├── Privacidad.js
│   │   └── Terminos.js
│   ├── services/          # Servicios y utilidades
│   │   ├── municipalityData.js
│   │   └── openaiService.js
│   ├── utils/             # Utilidades
│   │   └── passwordHash.js
│   ├── data/              # Datos GeoJSON
│   ├── Router.js          # Configuración de rutas
│   ├── App.js
│   └── index.js
└── package.json
```

## 🛣️ Rutas Disponibles

- `/` - Página de inicio
- `/mapa` - Mapa interactivo
- `/municipios` - Lista de municipios
- `/municipio/:municipioName` - Detalle de municipio
- `/cluster` - Mapa de clusters
- `/heatmap` - Mapa de calor
- `/3d` - Vista 3D
- `/analytics` - Página de analytics avanzado
- `/admin` - Login de administración
- `/admin/dashboard` - Panel de administración
- `/privacidad` - Política de privacidad
- `/terminos` - Términos de servicio

## 🛠️ Tecnologías Utilizadas

- **React 18** - Biblioteca de UI
- **React Router DOM** - Enrutamiento
- **Mapbox GL JS** - Mapas interactivos
- **Tailwind CSS** - Estilos
- **Recharts** - Gráficos interactivos
- **jsPDF** - Exportación a PDF
- **Lucide React** - Iconos
- **OpenAI API** - Generación de contenido con IA

## 📊 Funcionalidades de Analytics

- **K-Means Clustering**: Agrupación de municipios por características similares
- **Regresión Lineal**: Predicción de crecimiento de energía solar
- **Árboles de Decisión**: Clasificación de municipios
- **Análisis de Correlaciones**: Relaciones entre variables
- **Detección de Anomalías**: Identificación de valores atípicos
- **Análisis Regional**: Comparación por regiones
- **Segmentación de Mercado**: Clasificación de municipios por potencial
- **Análisis de Series Temporales**: Proyecciones futuras
- **Heatmaps Interactivos**: Visualización geográfica de métricas

## 🔐 Seguridad

- Autenticación con hash SHA-256 para el panel de administración
- Sesiones con expiración automática (8 horas)
- Protección de rutas administrativas
- Almacenamiento local seguro de datos

## 📝 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm test` - Ejecuta las pruebas
- `npm run eject` - Expone la configuración (irreversible)

## 🌐 Despliegue

### Despliegue en Vercel (Recomendado)

La aplicación está configurada para desplegarse fácilmente en Vercel:

1. **Instalar Vercel CLI** (opcional, para despliegue desde terminal):
```bash
npm i -g vercel
```

2. **Desplegar desde el terminal**:
```bash
vercel
```

3. **O desplegar desde GitHub**:
   - Conecta tu repositorio a Vercel en [vercel.com](https://vercel.com)
   - Vercel detectará automáticamente la configuración de React
   - Las variables de entorno se configuran en el dashboard de Vercel

4. **Configurar Variables de Entorno en Vercel**:
   
   Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:
   
   - `REACT_APP_MAPBOX_TOKEN` - Tu token de Mapbox
   - `REACT_APP_OPENAI_API_KEY` - (Opcional) Tu API key de OpenAI
   - `REACT_APP_ADMIN_PASSWORD_HASH` - (Opcional) Hash de tu contraseña de admin

   **Nota**: Vercel ya tiene configurado el archivo `vercel.json` que maneja el routing de React Router.

5. **URL de Producción**:
   - La aplicación estará disponible en: https://powersolarpr.vercel.app/
   - Cada push a la rama principal desplegará automáticamente

### Otras Plataformas

La aplicación también puede ser desplegada en:

- **Netlify**: Drag & drop o Git integration
- **GitHub Pages**: Con `gh-pages` package
- **AWS Amplify**: Integración con AWS

### Variables de Entorno en Producción

Asegúrate de configurar las variables de entorno en tu plataforma de despliegue:
- `REACT_APP_MAPBOX_TOKEN` - **Requerido**
- `REACT_APP_OPENAI_API_KEY` - Opcional (solo para admin panel)
- `REACT_APP_ADMIN_PASSWORD_HASH` - Opcional (solo para admin panel)

## 📄 Licencia

Este proyecto es de código abierto. Ver archivo LICENSE para más detalles.

## 👨‍💻 Desarrollador

Desarrollado con ❤️ por **Javier Jaramillo**

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para preguntas o problemas, por favor abre un issue en el repositorio de GitHub.

---

**Power Solar Map** - Visualización Interactiva de Clientes de Energía Solar en Puerto Rico
