# Titra

Seguimiento clínico de GLP-1 y péptidos para una consulta de endocrinología y sus pacientes.
PWA instalable en iPhone, datos en Supabase, interfaz en español e inglés.

> Titra es una herramienta de registro y referencia. No recomienda dosis: las pautas las
> introduce el prescriptor y las curvas son estimaciones de modelos farmacocinéticos poblacionales.

## Qué hace

**Paciente**

- **Curva de exposición en tiempo real.** Cada dosis alimenta un modelo farmacocinético de un
  compartimento con absorción de primer orden. La app muestra el fármaco activo estimado, el
  porcentaje de estado estacionario alcanzado y la proyección de las próximas semanas.
- **Titulación por protocolos.** Plantillas de ficha técnica (Wegovy, Ozempic, Rybelsus,
  Zepbound/Mounjaro, Saxenda, Victoza, Trulicity) y brazos de ensayo (retatrutida, CagriSema).
  Próxima dosis, escalón actual, días hasta la siguiente escalada y adherencia a 28 días.
- **Simulador.** Qué pasa si te saltas la próxima dosis, si suspendes, o si cambias de
  semaglutida a tirzepatida, sobre tu curva real.
- **Síntomas sobre la curva**, para ver si la náusea coincide con el pico plasmático.
- **Guardián de masa magra.** Objetivo de proteína, sesiones de fuerza, ritmo de pérdida y
  proporción de masa magra perdida.
- Medidas, analíticas con rangos de referencia, inventario con caducidades, rotación de puntos
  de inyección con mapa corporal, calculadora de reconstitución con jeringa U-100 y exportación
  CSV/JSON.

**Médico**

- Código de consulta que el paciente introduce para compartir sus datos.
- Panel de pacientes ordenado por prioridad: síntomas graves, dosis retrasada, escalada
  pendiente, pérdida rápida, adherencia baja, sin datos recientes.
- Ficha de cada paciente en solo lectura, pautas nuevas, notas clínicas visibles u ocultas
  para el paciente y notas propias en cada ficha de la wiki.

**Wiki** de 98 compuestos: incretinas, insulinas, hormonas, eje GH, péptidos de
reparación, metabólicos, sexuales, cognitivos, longevidad e inmunes. Cada ficha incluye mecanismo,
farmacocinética con fuente, dosificación separada en ficha técnica, ensayos y uso no aprobado,
efectos adversos, contraindicaciones, interacciones, monitorización, ensayos clave y referencias.

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: pega `supabase/migrations/20260919000000_init.sql` y pulsa **Run**.
   Crea las tablas, los disparadores y la Row Level Security de todas ellas.
3. **Authentication → URL Configuration**:
   - Site URL: `https://jmpastor2.github.io/titra/`
   - Redirect URLs: `https://jmpastor2.github.io/titra/` y `http://localhost:5173/`
4. **Project Settings → API**: copia la _Project URL_ y la _anon public key_.

### 2. Local

```bash
cp .env.example .env.local   # rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 3. GitHub Pages

1. **Settings → Secrets and variables → Actions**: crea `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`.
2. **Settings → Pages → Source**: _GitHub Actions_.
3. Cada push a `main` pasa tipos, lint y tests, y publica en `https://jmpastor2.github.io/titra/`.

### 4. iPhone

Safari → `https://jmpastor2.github.io/titra/` → Compartir → **Añadir a pantalla de inicio**.

### 5. Primer uso

1. El médico se registra eligiendo **Médico / clínico**. Su código de consulta aparece en la
   pantalla de Pacientes.
2. Cada paciente se registra como **Paciente** e introduce ese código al terminar el perfil,
   o más tarde en **Más → Mi médico**.

## Arquitectura

```
src/
  domain/      Lógica pura y testeada: motor PK, escenarios, pautas, reconstitución,
               rotación de puntos, masa magra. Sin React ni red.
  content/     Wiki y plantillas en TypeScript tipado, bilingüe. Viaja en el bundle
               para funcionar sin conexión.
  data/        Tipos de la base de datos, mapeadores y hooks de TanStack Query.
  features/    Pantallas por dominio: dashboard, dosis, salud, wiki, protocolos,
               consulta, simulador, calculadora, inventario, ajustes.
  components/  Sistema de diseño: botones, hojas inferiores, campos, tarjetas.
  i18n/        es.json y en.json con las mismas claves (un test lo verifica).
supabase/      Migraciones SQL con RLS.
```

- **Stack**: Vite 8, React 19, TypeScript 6 en modo estricto, Tailwind 4, TanStack Query,
  Recharts, i18next, vite-plugin-pwa, Supabase.
- **Sin conexión**: la caché de consultas se guarda en IndexedDB y las mutaciones pendientes se
  reanudan al volver la conexión. El service worker precachea la app y la wiki.
- **Seguridad**: cada tabla tiene RLS. El paciente es dueño de sus filas. El médico solo lee las
  de pacientes vinculados y solo puede crear o editar sus pautas. La vinculación pasa por una
  función `security definer` que valida el código.

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
