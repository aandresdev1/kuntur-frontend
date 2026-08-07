# Kuntur · Demo

Demo interactiva del sistema de seguimiento del alumno para instituciones de
inicial y primaria. **Todos los datos son ficticios.**

## Requisitos

- Node.js 18 o superior

## Correr en local

```bash
npm install
npm run dev
```

Abre la URL que muestra la consola (por defecto `http://localhost:5173`).

## Cuentas de prueba

La contraseña de todas es `demo1234`.

| Correo                             | Rol       | Qué ve                                        |
| ---------------------------------- | --------- | --------------------------------------------- |
| `direccion@losgirasoles.pe`        | Dirección | Todo, incluida la gestión de alumnos y aulas  |
| `carla.mendoza@losgirasoles.pe`    | Docente   | Solo su aula: asistencia, ficha y cuaderno    |
| `carlos.torres@gmail.com`          | Familia   | El día de su hija, cuaderno y portafolio      |

En la pantalla de login puedes hacer clic en cualquiera de las cuentas listadas
para entrar directo, sin escribir nada.

## Desplegar en Vercel

### Opción A — desde el panel web (recomendada)

1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel: **Add New… → Project** e importa el repositorio.
3. Vercel detecta Vite automáticamente. Verifica que quede así:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Deploy**.

### Opción B — desde la terminal

```bash
npm i -g vercel
vercel        # despliegue de prueba
vercel --prod # despliegue a producción
```

## Notas

- La página está marcada como `noindex` para que no aparezca en buscadores
  mientras sea una demo.
- No hay backend ni base de datos: el estado vive en memoria y se reinicia al
  recargar la página.
- El login es simulado y las credenciales están en el código. **No usar este
  esquema en producción.**

## Estructura

```
index.html          punto de entrada
src/main.jsx        montaje de React
src/App.jsx         toda la aplicación (vistas, datos mock y estilos)
src/index.css       reset mínimo
vite.config.js      configuración de Vite
```
