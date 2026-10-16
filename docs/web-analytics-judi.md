# Judi's Shop — Web Analytics

Integración de analítica de visitas preparada en `app/components/SiteAnalytics.tsx` e incluida desde `app/layout.tsx`.

## Activación desde Vercel

1. Abrir el proyecto `judis-shop` desde el equipo propietario.
2. En Web Analytics seleccionar **Enable**.
3. Desplegar de nuevo la rama `main` **después** de activar Analytics.
4. Visitar la tienda pública desde un navegador y comprobar la aparición de métricas. Los datos pueden tardar en mostrarse.
5. Consultar estadísticas desde `/admin/estadisticas`, que enlaza al panel privado de Vercel.

El componente omite páginas de administración, acceso y API, así como los parámetros de la URL. El acceso a los informes requiere permisos de la cuenta propietaria de Vercel. Las estadísticas se acumulan desde la activación, no incluyen tráfico anterior.

_Este archivo sirve como registro operativo y hace que el despliegue de producción se ejecute después de activar el servicio. No modifica las rutas públicas, los productos, ni la base de datos._
