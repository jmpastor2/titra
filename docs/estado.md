# Estado del proyecto (2026-10-06)

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

## Pendiente

1. Probar el teclado de las hojas (viales, agua) en el iPhone real.
2. Repasar con la cuenta real (`?real=1`, exportar copia a `src/dev/real-snapshot.json`, git-ignorada).
3. Poda de claves i18n sin uso: el script automático borra claves construidas dinámicamente
   (`cycle.decision.increase*`); hacerlo a mano o mejorar el script.
4. Avisos push: se activan en el iPhone (Más, Avisos).

## Cómo trabajar

- `npm run dev` y abrir `/lab.html` (`?empty=1`, `?now=ISO`, `?real=1`). `npm run check` antes de subir.
- Supabase por CLI: `npx supabase db query --linked --project-ref kdcckauwxagytzegfkpq "<sql>"`.
