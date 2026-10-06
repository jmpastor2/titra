# Estado del proyecto (2026-10-05)

Publicado en https://jmpastor2.github.io/titra/ (GitHub Pages, despliegue por Actions al hacer push a `main`).

## Hecho

- Registro: editar, borrar y asignar una toma extra a la toma retrasada que sustituye (`doses.planned_at`).
- Hoy: semana de cada ciclo, decisión semanal (subir o mantener), panel de registro rápido, carga en paralelo.
- Ciclos (`/cycles`), pautas editables (`/protocols/:id`, `/edit`), inventario con reconstitución y alertas leídas.
- Gráficas de niveles en SVG, toast único con Deshacer, datos leídos completos más allá del límite de 1000 filas.
- Migración 5 aplicada en Supabase y función `send-reminders` redesplegada (etiqueta propia para decisiones).
- Segunda tanda a medias pero estable (tsc, lint y 1523 tests en verde, build correcto): arranque más ligero
  (entrada JS 327 kB a 194 kB, precache 93 a 70 entradas), catálogo de compuestos partido en ligero y detalle,
  pulido visual de muchas pantallas y tarjeta "Versión y actualizaciones" en Ajustes.

## Pendiente (en este orden)

1. (Hecho) Recharts eliminado; teclado iOS en hojas (visualViewport + campos de 16 px); wiki con categorías plegadas.
2. Repasar con la cuenta real (`?real=1` en `lab.html`, exportando antes una copia a `src/dev/real-snapshot.json`,
   que está ignorada por git y se borra al terminar) el pulido de todas las pantallas: pestañas de Progreso,
   huecos de toque de 44 px, texto largo, claro/oscuro.
3. Podar las traducciones sin uso (script en el historial de la sesión: buscar claves sin referencia en `src`).
4. Actualizar `DESIGN.md` con lo nuevo (estado "extra", ciclos, toast con acción) y la nota de `content:meta`.
5. Avisos push: el usuario los activa en el iPhone (Más, Avisos).
6. Apagar el equipo solo cuando el usuario lo pida tras terminar todo.

## Cómo trabajar

- `npm run dev` y abrir `/lab.html` (`?empty=1`, `?now=ISO`, `?real=1`). `npm run check` antes de subir.
- Supabase por CLI: `npx supabase db query --linked --project-ref kdcckauwxagytzegfkpq "<sql>"`.
