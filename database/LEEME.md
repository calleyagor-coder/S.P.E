# Conectar S.P.E. a tu base de datos

Hoy la página guarda todo en el navegador (`localStorage`). Eso sirve para probar, pero cada
navegador tiene sus propios datos. Al pasar a una base de datos real todos verán lo mismo.

## Lo que ya está preparado
- `database/esquema.sql`: tablas, relaciones y datos de ejemplo (alumnos, computadoras, préstamos, actividad, administradores).
- `js/datos.js`: todo el acceso a datos está en **un solo archivo**. El bloque `Almacen` es lo único que toca
  `localStorage`; el resto de las páginas solo llama a `SPE.xxx()`.

## Opciones recomendadas (de más fácil a más completa)
1. **Supabase** (PostgreSQL en la nube, gratis para empezar). No necesitas escribir un servidor: la página habla con la
   base desde JavaScript y trae el login incluido. Es lo más rápido para tu caso.
2. **PHP + MySQL con XAMPP.** Si ya usas XAMPP en la escuela: creas pequeños archivos `api/alumnos.php`, etc.
   que leen y escriben en MySQL y devuelven JSON.
3. **Node.js + Express + MySQL o PostgreSQL.** Es la opción más profesional y escalable, pero requiere más trabajo.

En las tres, el esquema de `esquema.sql` sirve tal cual (en PostgreSQL cambia `AUTO_INCREMENT` y los `ENUM`).

## Pasos
1. Crea la base e importa `esquema.sql`.
2. Crea la API (o usa Supabase) con una ruta por cada función de la tabla de abajo.
3. En `js/datos.js` reemplaza cada función por una llamada con `fetch`. Con una base real las respuestas son
   **asíncronas**, así que esas funciones pasan a ser `async` y en `menu.js`, `cu-disponibles.js` y `panel-admin.js`
   hay que agregar `await` donde se llaman (por ejemplo `const alumnos = await SPE.alumnos();`).
4. Mueve el login al servidor (ver "Seguridad").

## Qué función corresponde a qué consulta
| Función actual | Qué hace | Ruta de API sugerida | SQL |
|---|---|---|---|
| `SPE.alumnos()` | listar alumnos | `GET /api/alumnos` | `SELECT * FROM alumnos` |
| `SPE.guardarAlumnos()` (registrar) | crear alumno | `POST /api/alumnos` | `INSERT INTO alumnos ...` |
| `SPE.guardarAlumnos()` (editar) | editar alumno | `PUT /api/alumnos/:dni` | `UPDATE alumnos SET ... WHERE dni=?` |
| eliminar alumno | borrar alumno | `DELETE /api/alumnos/:dni` | `DELETE FROM alumnos WHERE dni=?` |
| `SPE.pcs()` | listar computadoras | `GET /api/computadoras` | `SELECT * FROM computadoras` |
| `SPE.guardarPcs()` | crear / editar / borrar | `POST/PUT/DELETE /api/computadoras/:id` | `INSERT/UPDATE/DELETE` |
| `SPE.pedir(pcId, dni)` | pedir equipo | `POST /api/prestamos` | `INSERT INTO prestamos` + `UPDATE computadoras SET estado='Prestada'` |
| `SPE.devolver(id)` | devolver equipo | `PUT /api/prestamos/:id/devolver` | `UPDATE prestamos SET devuelto=NOW()` + `UPDATE computadoras SET estado='Disponible'` |
| `SPE.prestamos()` / `activos()` | historial / en uso | `GET /api/prestamos` | `SELECT ... WHERE devuelto IS NULL` |
| `SPE.log()` / `logs()` | actividad | `POST/GET /api/actividad` | `INSERT/SELECT ... ORDER BY fecha DESC LIMIT 60` |
| `SPE.buscarLogin()` + `ADMIN` en `index.js` | iniciar sesión | `POST /api/login` | ver "Seguridad" |

Importante: el pedido y la devolución deben ser **una transacción** (`START TRANSACTION ... COMMIT`), así dos
personas no pueden pedir la misma computadora a la vez.

## Seguridad (lo más importante al pasar a base de datos)
- **El login debe validarse en el servidor.** Hoy se valida en el navegador y el usuario del administrador está
  escrito en `js/index.js`, así que cualquiera puede verlo. Pasa el admin a la tabla `administradores`.
- **Guarda las contraseñas con hash** (`password_hash()` en PHP, `bcrypt` en Node). Que la contraseña sea el DNI es
  práctico, pero el DNI no es secreto; si puedes, deja que cada persona cambie la suya.
- El servidor debe comprobar el rol en cada ruta: solo el admin puede crear, editar o eliminar alumnos y computadoras.
- **Consultas preparadas** (`WHERE dni = ?`) siempre, nunca armar el SQL concatenando texto, para evitar inyección SQL.
- La foto de perfil se guarda hoy en base64 dentro del navegador. En la base guarda solo la ruta del archivo (`alumnos.foto`).
- Nunca subas a GitHub las claves de la base (usa un archivo `.env` y agrégalo a `.gitignore`).

## Para migrar los datos que ya cargaste
En la consola del navegador (F12) ejecuta `JSON.stringify(SPE.alumnos())` y lo mismo con `SPE.pcs()` y `SPE.prestamos()`.
Ese JSON se puede importar a MySQL o a Supabase.
