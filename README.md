# Titra

Tu laboratorio personal de péptidos: pautas, tomas, zonas, viales, niveles estimados, mejoras y una
wiki de 99 compuestos. PWA instalable en iPhone, datos en Supabase, en español e inglés. Tu control
se puede compartir en solo lectura con quien tú decidas, por ejemplo tu médico.

> Titra es una herramienta de registro y referencia. No recomienda dosis y las curvas son
> estimaciones de modelos farmacocinéticos poblacionales.

## Qué hace

- **Hoy.** Lo que toca ahora (siguiente toma con las unidades a cargar), la semana de cada ciclo
  ("semana 3 de 12") con la decisión de la semana ("¿subes o mantienes una semana más?"), avisos de
  stock, agenda del día con todas tus pautas, niveles de cada sustancia y un panel de registro
  rápido (toma, agua, peso, check-in, ayuno, síntoma, proteína).
- **Registro que se corrige.** Cada toma se puede editar o borrar (el stock del vial se ajusta solo).
  Si te pones una toma de más para compensar una retrasada, Titra te ofrece asignarla a la toma
  perdida: así la adherencia y el progreso cuentan lo que de verdad hiciste.
- **Ciclos.** Línea de tiempo de todas tus pautas con sus escalones, semana por semana, descansos,
  cómo va cada ciclo (adherencia, tomas, peso) y empezar uno nuevo desde donde lo dejaste.
- **Pautas completas y editables.** Cada N días o por días de la semana (de lunes a viernes para CJC
  con ipamorelina), varias tomas al día, tomas de noche pasada la medianoche, escalones de dosis,
  pausas para ciclar y mezclas en la misma jeringa. Se editan en U, mg o mcg; "mantener una semana
  más", adelantar un escalón, pausar, duplicar y guardar como pauta reutilizable.
- **Jeringa a escala.** Con el vial y su agua bacteriostática, Titra dibuja la jeringa U-100
  (0,3, 0,5 o 1 mL según la carga) con las unidades exactas. En una mezcla (CJC con ipamorelina)
  marca cada carga en orden. Descuenta del vial y sugiere la zona menos usada.
- **Avisos cuando toca.** Notificación con la dosis y las unidades a cargar, y la víspera de una
  subida de dosis para que decidas. Si ya registraste la toma, no avisa. En iPhone requiere la app
  instalada (iOS 16.4+).
- **Viales con autonomía.** Pasa un vial de liofilizado a reconstituido sin reescribirlo todo, cuántas
  tomas cubre cada vial (contando las subidas de dosis), cuándo pedir otro y cuándo caduca. Las
  alertas se marcan como leídas y no vuelven.
- **Niveles.** Modelo farmacocinético de un compartimento con fármaco a bordo, estado estacionario,
  proyección y simulador de "¿y si me salto una dosis?" o cambio de fármaco. Solo para sustancias con
  datos farmacocinéticos en humanos; el resto muestra su línea de tomas.
- **Progreso.** Resumen con tus cifras clave, cuerpo y masa magra, check-in de bienestar, síntomas y
  analíticas con rangos, y una proyección a futuro basada en ensayos publicados.
- **Aprende.** Wiki bilingüe con mecanismo, farmacocinética con fuente, dosificación separada en ficha
  técnica, ensayos y uso no aprobado, efectos adversos, interacciones y referencias. Integrada en cada
  sustancia que usas.
- **Compartir.** Cada cuenta tiene un código. Para enseñar tu control, introduces el código de quien lo
  verá. Esa persona lo ve en solo lectura, puede dejar notas y proponer pautas, y tú puedes retirarlo.

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: pega y ejecuta, en orden, los ficheros de `supabase/migrations/`:
   `20260919000000_init.sql`, `20260925000000_personal_tracking.sql`,
   `20260926000000_reminders.sql`, `20260927000000_blend_vials.sql` y
   `20261004000000_edit_doses_dismissals.sql`. Crean las tablas, los disparadores, la Row Level
   Security, la tarea programada de avisos, los viales con mezcla, la edición de tomas con ajuste de
   stock y las alertas marcadas como leídas. Con el CLI de Supabase ya enlazado también valen
   `npx supabase db query --linked -f supabase/migrations/<archivo>.sql`.
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
  domain/      Lógica pura y testeada: motor PK, escenarios, pautas (calendario, casación de
               tomas con su toma prevista, ciclos y escalones), reconstitución, rotación de
               puntos, masa magra. Sin React ni red.
  content/     Wiki y plantillas en TypeScript tipado, bilingüe. Viaja en el bundle
               para funcionar sin conexión.
  data/        Tipos de la base de datos, mapeadores y hooks de TanStack Query.
  features/    Pantallas por dominio: hoy, tomas, progreso, wiki, pautas, inventario,
               avisos, compartir, simulador, calculadora, ajustes.
  components/  Sistema de diseño: botones, hojas inferiores, campos, tarjetas.
  i18n/        es.json y en.json con las mismas claves (un test lo verifica).
  dev/         Laboratorio de desarrollo (ver más abajo). No viaja en la app publicada.
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

## Laboratorio de desarrollo

`npm run dev` y abre `http://localhost:5173/lab.html`: la app real (mismas rutas y pantallas) sobre una
base de datos falsa en memoria, sembrada respecto a hoy con una cuenta de la semana 4. Lo que haces en
ella solo vive en memoria; recargar la reinicia. Sirve para ver y probar sin tocar Supabase.

- `?empty=1` abre una cuenta nueva sin datos.
- `?now=2026-10-04T20:30` hace que la app crea que es ese momento (el reloj sigue avanzando): el domingo
  por la noche antes de una subida de dosis, la madrugada tras una toma de noche...
- `?real=1` abre una copia de una cuenta real si existe `src/dev/real-snapshot.json` (se exporta con el
  CLI de Supabase; está en `.gitignore` y nunca se sube).

`src/dev/smoke.test.tsx` recorre todas las rutas contra esa base de datos, con cuenta real y con cuenta
nueva, y falla ante un error de ejecución, una traducción que falta o un `undefined` en pantalla.

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
