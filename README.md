# Sistema web de encuestas ACE 2026 — DASE / El Alto

Proyecto funcional con **React + Vite (frontend)**, **Node.js + Express (API)** y **PostgreSQL (base de datos)**. Diseño responsive para computadora y teléfono. Incluye las imágenes institucionales facilitadas, 3 instrumentos, gestión de unidades educativas, panel administrativo, estadísticas, registros con nombres y exportación **Excel .xlsx**.

> IMPORTANTE: los archivos del proyecto NO contienen una base de datos con respuestas reales. Los datos se guardan en PostgreSQL después de configurar el servidor. No utilices el sistema con datos personales de menores hasta contar con autorización institucional, aviso de privacidad y HTTPS en producción.

## Requisitos

- Visual Studio Code
- **Node.js >= 22.12**: https://nodejs.org/
- **PostgreSQL** (y opcionalmente pgAdmin): https://www.postgresql.org/download/
- Terminal PowerShell / Windows Terminal (o terminal VS Code)

## PASO 1. Abrir en Visual Studio Code

1. Extrae `ACE_2026_WEB.zip`.
2. Abre VS Code, menú **Archivo > Abrir carpeta**, y selecciona `ACE_2026_WEB`.
3. Abre **Terminal > Nueva terminal**.
4. Comprueba las versiones:

```powershell
node -v
npm -v
```

## PASO 2. Crear la base de datos (una sola vez)

1. Instala PostgreSQL. Durante la instalación, anota la contraseña que asignaste al usuario `postgres`.
2. Abre **pgAdmin** y conéctate al servidor PostgreSQL.
3. Haz clic derecho **Databases > Create > Database**. Nombre: `ace_2026`. Guarda.
   - Alternativa en Query Tool de la base `postgres`: `CREATE DATABASE ace_2026;` (sin estar dentro de una transacción).
4. Dentro del proyecto, copia `.env.example` a `.env`:

```powershell
Copy-Item .env.example .env
```

5. Abre el archivo `.env` y reemplaza `CAMBIAR_CLAVE` con tu contraseña real de PostgreSQL. El ejemplo supone PostgreSQL en `localhost:5432` y el usuario `postgres`.
6. Genera un secreto para proteger la sesión administrativa:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia los 64 caracteres que aparecerán y reemplaza todo el valor de `JWT_SECRET=` en `.env`.

**No publiques `.env` en GitHub, WhatsApp ni en la web.** Si tu contraseña PostgreSQL tiene símbolos como `@` o `#`, debes codificarlos en la URL o utilizar una contraseña sin caracteres reservados para la conexión local.

## PASO 3. Instalar las dependencias

En la terminal de VS Code, dentro de la carpeta del proyecto:

```powershell
npm install
npm run db:init
npm run test:logic
```

`db:init` crea tres tablas en tu PostgreSQL local: `schools`, `admins` y `surveys`. El comando se puede volver a ejecutar y no borra los datos existentes.

## PASO 4. Crear la cuenta administradora

```powershell
npm run admin:create
```

Escribe tu usuario y tu contraseña personal de **12 caracteres o más**. Atención: la terminal puede mostrar la contraseña mientras escribes; hazlo en privado, sin compartir la pantalla. La contraseña se almacena como un hash bcrypt, no como texto plano.

No hay usuarios ni contraseñas de ejemplo activados por defecto.

## PASO 5. Encender la aplicación

```powershell
npm run dev
```

Se abrirán dos servidores **en una misma terminal**:
- Sitio web: **http://localhost:5173**
- API interna: **http://localhost:3001**

En el navegador abre **http://localhost:5173**.

### Primer uso

1. Haz clic en **Administración** (o abre `http://localhost:5173/admin`).
2. Inicia sesión con las credenciales del paso 4.
3. En **Unidades educativas**, agrega los colegios reales participantes.
4. Vuelve a **Inicio**, selecciona **Estudiantes**, **Padres / tutores** o **Personal educativo** y llena una encuesta de prueba con datos ficticios.
5. Ingresa de nuevo a Administración: aparecerán los resultados en estadísticas, listado y Excel.

> Por diseño, el sistema NO inventa ni precarga colegios. Primero el administrador debe incorporarlos.

## PASO 6. Probar desde un celular en la misma Wi-Fi

1. Conecta la computadora y el celular a la **misma red Wi-Fi**.
2. Deja `npm run dev` encendido en la PC.
3. En Windows abre CMD y ejecuta `ipconfig`. Identifica la dirección IPv4 de la PC en tu red, por ejemplo `192.168.1.15` (solo un ejemplo).
4. En el navegador del celular abre `http://IP_DE_TU_PC:5173`, sustituyendo esa parte por la IP real.
5. Si no carga, revisa la configuración del firewall de Windows y que ambos dispositivos estén conectados a la misma red.

**Seguridad:** este acceso HTTP local es únicamente para PRUEBAS con información ficticia, no para recolectar nombres reales de menores en una red compartida. Para encuestas oficiales usa un sitio HTTPS y servidor seguro.

## PASO 7. Preparar una versión de producción

```powershell
npm run build
npm start
```

- `npm run build`: genera el sitio optimizado en `dist/`.
- `npm start`: el servidor Express atiende la API **y sirve el frontend** por un único puerto (`PORT` de `.env`, por defecto 3001).
- Para uso fuera de tu red, despliega el proyecto en un servicio que ejecute Node.js y PostgreSQL administrado.
- Configura variables privadas en el hosting: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `DB_SSL=true` si tu proveedor acepta la verificación de certificados, `PORT` según la plataforma.
- Activa HTTPS, copias de seguridad, actualizaciones de dependencias, supervisión, evaluación de privacidad y controles de acceso antes de usarlo oficialmente.
- La IP local de tu computadora **no es** una dirección pública de internet. Para acceso público se requiere desplegarlo.

## ¿Dónde se guardan las encuestas?

En la tabla PostgreSQL `surveys`. Cada registro contiene:

| Columna | Qué almacena |
|---|---|
| `id` | Identificador único UUID |
| `school_id` | Colegio al que pertenece |
| `survey_type` | `estudiantes`, `padres` o `personal` |
| `first_name`, `last_name` | Nombres y apellidos |
| `grade`, `position` | Grado escolar o cargo |
| `answers` | Respuestas a `q1`...`q5` como JSONB |
| `created_at` | Fecha y hora con zona horaria |

La API valida las alternativas en el servidor y utiliza consultas SQL parametrizadas. Las rutas `/api/admin/*` para leer resultados requieren autenticación salvo `login` y `logout`. La contraseña administrativa se guarda como bcrypt y la sesión en cookie `HttpOnly`; el sistema utiliza limitadores de solicitudes.

Las preguntas e incisos se encuentran en **`shared/questions.js`**, y se basan en el documento original. **La pregunta 3 de estudiantes solo se responde si elige “No Lo consume” en la pregunta 2**. Cuando no corresponde, se excluye de las respuestas guardadas y del cómputo de esa pregunta.

## Estructura

```text
ACE_2026_WEB/
├── .env.example             Variables de entorno (plantilla)
├── .gitignore
├── package.json             Dependencias y comandos
├── vite.config.js           Configuración React/Vite y proxy
├── index.html               Entrada del sitio
├── public/images/           Imágenes DASE y El Alto enviadas por ti
│   ├── dase.png
│   └── el-alto.png
├── src/
│   ├── main.jsx             Portada, formularios y panel administrativo
│   └── styles.css           Diseño responsive, efectos y botones flotantes
├── shared/
│   └── questions.js         Preguntas y alternativas de los tres instrumentos
└── server/
    ├── index.js             API, permisos, resultados y Excel
    ├── db.js                Conexión PostgreSQL
    ├── schema.sql           Tablas e índices
    ├── init-db.js           Inicializador
    ├── create-admin.js      Creación de credenciales
    ├── validation.js        Validaciones reales en servidor
    └── validation.test.js   Pruebas automáticas
```

## Notas de privacidad / alcance

- La versión entregada es un **MVP funcional** para desarrollo y pruebas. No incluye recopilación offline, corrección posterior de encuestas, roles múltiples, gestión de consentimientos ni historial de auditoría.
- Al elegir que la conexión sería **“primero en mi computadora y después por internet”**, se diseñó una aplicación para local → hospedaje público, **no un modo sin conexión**.
- Toda persona con el enlace podrá responder. Los limitadores por IP reducen abuso, pero **no impiden completamente respuestas duplicadas** o envíos intencionalmente incorrectos.
- Los nombres y apellidos se solicitan porque así se indicó. Para menores de edad debe existir base institucional válida para su tratamiento y la información visible a encuestados debe ser formalizada.
- No se solicitan número de carnet, domicilio ni fecha de nacimiento.
- El registro puede filtrar por escuela y tipo. El Excel se descarga desde el panel protegido en 3 hojas, una por instrumento.
- Para uso público a mayor escala: backups cifrados, política de retención y eliminación, registro de accesos, protección CSRF adicional, monitoreo y pruebas de seguridad.

## Solución rápida de errores

**`npm` no se reconoce:** instala Node.js y reinicia VS Code.

**`password authentication failed for user postgres`:** comprueba contraseña/URL en `.env` y que PostgreSQL esté funcionando.

**`database "ace_2026" does not exist`:** crea la base en pgAdmin (paso 2).

**`JWT_SECRET falta o es inseguro`:** genera y pega el secreto del paso 2 en `.env`.

**La lista de colegios está vacía:** ingresa en Administración y registra al menos una unidad educativa.

**La página se abre, pero no guarda:** revisa que `npm run dev` muestre tanto API como WEB y que PostgreSQL esté encendido.

**Celular no conecta:** comprueba Wi-Fi, IP de la computadora, firewall y puerto 5173.
