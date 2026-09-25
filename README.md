# Titra

Tu laboratorio personal de péptidos: pautas, tomas, zonas, viales, niveles estimados, mejoras y una
wiki de 99 compuestos. PWA instalable en iPhone, datos en Supabase, en español e inglés. Tu control
se puede compartir en solo lectura con quien tú decidas, por ejemplo tu médico.

> Titra es una herramienta de registro y referencia. No recomienda dosis y las curvas son
> estimaciones de modelos farmacocinéticos poblacionales.

## Qué hace

- **Hoy.** Agenda del día con todas las tomas de todas tus pautas, un toque para registrar cada una,
  tira de 24 horas y el estado de cada sustancia.
- **Pautas completas.** Cada N días o por días de la semana (de lunes a viernes para CJC con
  ipamorelina), varias tomas al día, escalones de dosis, pausas para ciclar y mezclas en la misma
  jeringa. Se guardan como pautas reutilizables y se pueden compartir.
- **Jeringa a escala.** Con el vial y su agua bacteriostática, Titra dibuja la jeringa U-100
  (0,3, 0,5 o 1 mL según la carga) con las unidades exactas. En una mezcla (CJC con ipamorelina)
  marca cada carga en orden: 10 U de Mod GRF y hasta 15 U con ipamorelina. Descuenta del vial y
  sugiere la zona menos usada.
- **Avisos cuando toca.** Notificación con la dosis y las unidades a cargar, a la hora o hasta 1 h
  antes. Si ya registraste la toma, no avisa. En iPhone requiere la app instalada (iOS 16.4+).
- **Dosis graduales.** Cada pauta muestra su escalera de dosis, el escalón actual, cuándo sube la
  dosis y la adherencia de los últimos 28 días.
- **Viales con autonomía.** Cuántas tomas cubre cada vial, contando las subidas de dosis, y cuándo
  tener listo el siguiente o si caduca antes.
- **Niveles.** Modelo farmacocinético de un compartimento con fármaco a bordo, estado estacionario,
  proyección y simulador de "¿y si me salto una dosis?" o cambio de fármaco. Solo para sustancias con
  datos farmacocinéticos en humanos.
- **Progreso.** Check-in de bienestar (energía, sueño, ánimo, recuperación, concentración, apetito,
  libido), cuerpo y masa magra, síntomas y analíticas con rangos.
- **Aprende.** Wiki bilingüe con mecanismo, farmacocinética con fuente, dosificación separada en ficha
  técnica, ensayos y uso no aprobado, efectos adversos, interacciones y referencias. Integrada en cada
  sustancia que usas.
- **Compartir.** Cada cuenta tiene un código. Para enseñar tu control, introduces el código de quien lo
  verá. Esa persona lo ve en solo lectura, puede dejar notas y proponer pautas, y tú puedes retirarlo.

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: pega y ejecuta, en orden, los ficheros de `supabase/migrations/`:
   `20260919000000_init.sql`, `20260925000000_personal_tracking.sql` y
   `20260926000000_reminders.sql`. Crean las tablas, los disparadores, la Row Level Security y
   la tarea programada de avisos.
3. **Avisos push**: sigue [docs/notificaciones.md](docs/notificaciones.md) para subir la Edge
   Function `send-reminders` y sus secretos. Sin este paso, Titra avisa solo con la app abierta.
4. **Authentication → URL Configuration**:
   - Site URL: `https://jmpastor2.github.io/titra/`
   - Redirect URLs: `https://jmpastor2.github.io/titra/` y `http://localhost:5173/`
5. **Project Settings → API**: copia la _Project URL_ y la _anon public key_.

### 2. Local

```bash
cp .env.example .env.local   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y VITE_VAPID_PUBLIC_KEY
npm install
npm run dev
```

### 3. GitHub Pages

1. **Settings → Secrets and variables → Actions**: crea `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` y `VITE_VAPID_PUBLIC_KEY`.
2. **Settings → Pages → Source**: _GitHub Actions_.
3. Cada push a `main` pasa tipos, lint y tests, y publica en `https://jmpastor2.github.io/titra/`.

### 4. iPhone

Safari → `https://jmpastor2.github.io/titra/` → Compartir → **Añadir a pantalla de inicio**.

### 5. Primer uso

Cada persona se registra y monta su laboratorio desde **Hoy**: primera pauta, primer vial y wiki.
Para compartir, **Más → Compartir**.

## Arquitectura

```
src/
  domain/      Lógica pura y testeada: motor PK, escenarios, pautas, reconstitución,
               rotación de puntos, masa magra. Sin React ni red.
  content/     Wiki y plantillas en TypeScript tipado, bilingüe. Viaja en el bundle
               para funcionar sin conexión.
  data/        Tipos de la base de datos, mapeadores y hooks de TanStack Query.
  features/    Pantallas por dominio: hoy, tomas, progreso, wiki, pautas, inventario,
               avisos, compartir, simulador, calculadora, ajustes.
  components/  Sistema de diseño: botones, hojas inferiores, campos, tarjetas.
  i18n/        es.json y en.json con las mismas claves (un test lo verifica).
supabase/      Migraciones SQL con RLS y la Edge Function send-reminders.
public/push-sw.js  Avisos push y clic en la notificación, importado por el service worker.
```

- **Stack**: Vite 8, React 19, TypeScript 6 en modo estricto, Tailwind 4, TanStack Query,
  Recharts, i18next, vite-plugin-pwa, Supabase.
- **Sin conexión**: la caché de consultas se guarda en IndexedDB y las mutaciones pendientes se
  reanudan al volver la conexión. El service worker precachea la app y la wiki.
- **Seguridad**: cada tabla tiene RLS. Cada usuario es dueño de sus filas. Quien ve un control
  compartido solo lo lee y puede proponer pautas. El dueño comparte introduciendo el código de
  quien lo verá, mediante una función `security definer`.
- **Avisos**: el dispositivo calcula las próximas tomas en su zona horaria y las guarda con
  `replace_reminders()`. Cada 5 minutos pg_cron llama a `send-reminders`, que envía Web Push
  (VAPID) y descarta los avisos cuya toma ya está registrada.

## Modelo farmacocinético

Un compartimento, absorción y eliminación de primer orden (función de Bateman) con superposición
lineal de dosis. `ka` se resuelve numéricamente a partir del `tmax` de ficha técnica, de modo que
la cinética _flip-flop_ de los depósitos sale de la misma fórmula. El motor informa de cantidad
sistémica en mg y solo convierte a concentración cuando la ficha declara volumen aparente.

Los tests comprueban el motor contra soluciones analíticas: acumulación, pico y valle en estado
estacionario, convergencia de la superposición numérica y tiempo al 90 % y 97 %.

## Scripts

| Comando         | Qué hace                                           |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Servidor de desarrollo                             |
| `npm run build` | Tipos, build de producción y `404.html` para Pages |
| `npm test`      | Vitest                                             |
| `npm run lint`  | oxlint                                             |
| `npm run check` | Tipos, lint, tests y formato                       |

## Aviso regulatorio

Para usar Titra con pacientes reales en EE. UU., los datos son información sanitaria protegida.
Supabase firma un BAA de HIPAA solo en los planes que lo incluyen: actívalo antes de dar de alta
pacientes. La app no recomienda dosis ni ajustes de tratamiento.
