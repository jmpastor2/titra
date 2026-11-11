# Estado del proyecto (2026-10-13)

Publicado en https://jmpastor2.github.io/titra/ (GitHub Pages, despliegue por Actions al hacer push a `main`).

## Hecho

- Primera tanda: editar, borrar y asignar tomas, ciclos, pautas editables, inventario con reconstitución,
  alertas leídas, registro rápido, gráficas SVG, toast con Deshacer, lectura completa de tablas.
- Segunda tanda: arranque ligero, catálogo partido en ligero y detalle, Recharts eliminado, tarjeta de versión.
- Tercera tanda (Titra 2):
  - Paleta nueva sin verde (grafito + índigo, acento cian), sin cuadrícula; iconos y splash regenerados.
  - Teclado de iOS: las hojas siguen el viewport visual y los campos usan 16 px (no hay zoom al escribir).
  - Hoy: hero con anillo del día, racha, adherencia, semana de ciclo, días de stock, niveles a ancho completo.
  - Registro: cabecera con anillo semanal y KPIs, filtro de una línea, filas sin texto cortado.
  - Pautas y Ciclos: tarjetas con anillo, tira de fases, decisión semanal unificada.
  - Inventario: sin texto cortado, tarjetas de un solo número, cobertura de stock, caducidad en anillo.
  - Progreso: constancia (calendario 12 semanas, rachas), total administrado, peso con ritmo y objetivo.
  - Futuro: un rango grande, gráfica con tendencia, lista única de qué medir.
  - Más: grupos con insignias en vivo. Wiki: 44 entradas, categorías plegadas, fichas escaneables.
  - Primitivas: `components/kpi/Ring`, `PageHeader`/filas sin truncado, `Segmented` escala a 320 px.

- Cuarta tanda («instrumento silencioso», ver `DESIGN.md`):
  - Tema: fuente del sistema, cifras SF Pro Rounded, acento iris, botón principal en tinta, sin fuentes
    web, sin anillos, sin etiquetas en mayúsculas, sin cajas dentro de cajas. Icono y splash nuevos.
  - Kit `src/components/kpi` (Kpi, Delta, Meter, Ticks, Steps, Spark, DayTrack); `lab.html?kit=1`.
  - Hoy en 6 bloques (próxima toma con las próximas 24 h, 4 KPIs, una sola decisión, registro rápido,
    niveles). Registro con Puntualidad. Pautas con escalera. Futuro con escala «dónde estás frente al ensayo».
  - Datos: la cobertura de stock tiene en cuenta la caducidad (`inventory/supply.ts`), la tarjeta de vial
    cuenta solo las tomas antes de caducar, la decisión deja de preguntar si la toma ya se hizo a la dosis
    nueva, en Futuro «tu dosis en esa fecha», Más cuenta «urgentes».

- Quinta tanda (hojas y formularios): todas las hojas sin cajas dentro de cajas, un botón principal que dice lo
  que hace, altura fija (`tall`) donde el contenido cambia. `Sheet` abre desde un primer fotograma fuera de
  pantalla con transición, nunca puede desplazarse (`overflow: clip` + reset de scroll: en iOS se iba arriba y
  desaparecía), no abre el teclado al abrirse en el móvil y solo se ajusta al viewport visual con teclado.
  Agua: cada toque cuenta una vez (`listHolds` en `quicklog/data.ts`), pastilla «+250 ml» en la tarjeta.

- Uso real (octubre): un vial reconstituido vale 28 días (después no es válido; la cobertura de stock
  lo cuenta así y la toma se saca de un vial válido, `pastUse` en `inventory/vials.ts`). Al reconstituir,
  propuesta de agua para U enteras y lo que da el vial en sus 28 días (`inventory/inUsePlan.ts`). Una toma
  extra puede cubrir una perdida hasta 7 días después (empezar antes de la pauta). Sugerencia de hora
  habitual en Pautas (`protocols/habit.ts`). Referencia de descanso leída de las notas de cada pauta.
  Mezclas sin reconstituir: masa total y partes nombradas.

- Acceso con aprobación (migración 6, `20261013000000_access_approval.sql`, aplicada el 2026-10-13): quien se
  registra («Solicitar acceso») queda pendiente y la base de datos no le deja leer ni escribir nada (política
  restrictiva `approved_only` en cada tabla de `public`; una tabla nueva necesita volver a ejecutar la migración).
  Pantalla «Solicitud enviada» con «Comprobar de nuevo»; Más → Accesos (solo admin) para aprobar, rechazar o
  quitar el acceso. Cada solicitud avisa por ntfy.sh (secreto de Vault `access_ntfy_topic`). El enlace mágico ya
  no crea cuentas. Los admins se marcan a mano en `public.access.is_admin`.

- Arreglos (2026-10-22): la agenda de Orbe ya no oculta las tomas hechas ni cuenta las decisiones de subida
  (migración `20261022010000_orbe_agenda_fix.sql`, aplicada; Orbe necesita los avisos activados porque lee
  `reminders`, 14 días). Las tomas y medidas guardadas sin conexión se reanudan tras recargar (`mk` y
  `registerMutationDefaults` en `data/hooks.ts`). Cerrar sesión (`features/auth/signOut.ts`) quita el push de
  este dispositivo, la caché y la copia offline. Errores con su estado HTTP (no se reintentan los 4xx). Zoom
  permitido, el push no vuelve a sonar sobre el aviso local, la app busca versión nueva al volver.

- Puntos de inyección (2026-10-30): 16 puntos (abdomen lateral, muslo exterior y flancos nuevos; los ids viejos no cambian),
  zonas activables por dispositivo (`lib/siteZones.ts`, por defecto abdomen y muslos) de las que salen las sugerencias,
  «Cada punto descansa N días» = puntos ÷ pinchazos al día de los últimos 14 días frente a 7 días, con las zonas que
  faltan para llegar (`restOutlook` en `domain/sites/rotation.ts`). Mapa de una figura con Delante/Detrás (dianas
  ≥ 44 px); en las hojas de toma, 3 sugerencias y «Todos los puntos» por zona en lugar del mapa pequeño.

- Más zonas (2026-11-08): 22 puntos. Tríceps alto y bajo (`arm_*`, `arm_ll/lr`), michelines (`flank_*`) y cadera
  (`hip_*`), lumbar (`back_*`, zona nueva `back`). Por defecto todas las zonas activas (clave `titra.siteZones.v2`:
  abdomen y muslos solos daban la vuelta en menos de una semana). Muñeco nuevo: silueta suave (Catmull-Rom) con
  cabeza y brazos separados. La tabla de los 14 días solo lista los puntos usados.

- Jeringa a la vista (2026-11-10): la próxima toma de Hoy dibuja la jeringa cargándose (`doses/PlanSyringe.tsx`, un toque
  la repite) y en la hoja de toma va la primera de «Dosis». Niveles solo lista lo que está en una pauta activa o aún a
  bordo (`isTracked` en `today/levels.ts`); una pauta recién empezada dice su primera toma. Pautas activas antes que las
  pausadas. SS-31 se llama así (`SS-31 (elamipretida)`) y lleva color propio (`OWN_HUE` en `content/substanceColor.ts`).

- Momento de la toma (2026-11-11): al registrar, la jeringa se vacía sobre la hoja y dice «Toma registrada» antes de
  cerrarse (`doses/InjectedCover.tsx`, `cover` de `Sheet`, `pushed` de `Syringe`; un toque lo salta, nada con movimiento
  reducido). En Hoy la cifra de unidades sube con el émbolo (`lib/useCountUp.ts`) y dice las tomas que quedan en el vial.
  Tests con movimiento reducido: `withReducedMotion()` de `src/test/motion.ts`.

- 2026-11-11 (pulsera): Forja manda tras cada sincronización con Google Health (a diario a las 08:00)
  los días leídos a `public.health_ingest` (migración `20261111000000_health_ingest.sql`, aplicada;
  clave en Vault `health_ingest_key_sha256`, paciente en `health_ingest_patient_id`). Quedan como
  mediciones con `source = 'google_health'`: peso, % grasa, FC en reposo, pasos, horas de sueño,
  proteína (cuando se apunta comida en Google Health) y sesiones de fuerza. Cada envío reescribe
  esos días; las mediciones a mano no se tocan. Sueño y pasos tienen gráfica en Mediciones.

## Pendiente

1. Probar el teclado de las hojas (viales, agua) en el iPhone real.
2. Repasar con la cuenta real (`?real=1`, exportar copia a `src/dev/real-snapshot.json`, git-ignorada).
3. Poda de i18n: hecha (`scratchpad/i18n_unused.py` ya reconoce claves construidas con plantillas).
4. Avisos push: se activan en el iPhone (Más, Avisos).

## Cómo trabajar

- `npm run dev` y abrir `/lab.html` (`?empty=1`, `?now=ISO`, `?real=1`). `npm run check` antes de subir.
- Supabase por CLI: `npx supabase db query --linked --project-ref kdcckauwxagytzegfkpq "<sql>"`.
