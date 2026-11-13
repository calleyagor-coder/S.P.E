# S.P.E. · Sistema de Préstamo de Computadoras

Proyecto Final Integrador 2026 · Centro Educativo Nonogasta (C.E.N.) · 5° Año T.I.P.P.

**Integrantes:** _(completar)_
**Docente:** Prof. Guardia, Sebastián Nicolás

## Descripción
Aplicación web para gestionar el préstamo de computadoras de la escuela: alta, consulta, edición y baja
de alumnos y equipos, y registro de préstamos y devoluciones.

## Tecnologías
HTML5 · CSS3 · JavaScript (Fetch API) · Node.js (funciones serverless) · Supabase (PostgreSQL) · GitHub · Vercel · PROJECTHUB

## Estructura
    public/   → páginas, css, js, imágenes (frontend)
    api/      → funciones del backend (config.js, alumnos.js, computadoras.js, prestamos.js)
    database/ → script SQL para Supabase

## Variables de entorno
Copiar `.env.example` como `.env` y completar `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
En Vercel se cargan en *Settings → Environment Variables* (nunca se suben a GitHub).
Opcionales: `SUPABASE_SECRET_KEY` (clave secreta, solo servidor), `ADMIN_USUARIO` y `ADMIN_CLAVE`.

## Endpoints de la API
| Ruta | Métodos | Uso |
|---|---|---|
| `/api/alumnos` (`?dni=`) | GET · POST · PUT · DELETE | CRUD de alumnos |
| `/api/computadoras` (`?id=`) | GET · POST · PUT · DELETE | CRUD de computadoras |
| `/api/prestamos` (`?id=`) | GET · POST · PUT | pedir y devolver equipos |
| `/api/actividad` | GET · POST | registro de movimientos |
| `/api/login` | POST | valida usuario y contraseña en el servidor |
| `/api/estadisticas` | GET | contadores de la pantalla de inicio |

## Base de datos
Ejecutar `database/supabase.sql` en el *SQL Editor* de Supabase. Si ya lo habías ejecutado antes, ejecutar solo `database/actividad.sql`.
