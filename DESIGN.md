# Titra · instrumento silencioso

Titra es tu control de péptidos: pautas, tomas, viales y resultados con lecturas claras.
La interfaz es un instrumento silencioso: pocas cosas por pantalla, un número protagonista por
tarjeta y gráficos pequeños que muestran la forma, nunca decoración.

## Principios

- **Un número, una idea.** Cada tarjeta responde a una pregunta («¿voy bien?», «¿cuándo me quedo
  sin?», «¿funciona?») con un número grande, una línea que lo explica y, si ayuda, un gráfico mínimo.
- **Sin cajas dentro de cajas.** Dentro de una tarjeta se separa con espacio, líneas finas o una
  rejilla de datos; nunca con otro panel con borde.
- **Sin círculos.** Los indicadores son lineales: barras finas con objetivo, tiras de días,
  escaleras de semanas, mini-líneas y la línea de 24 h. Leen mejor y ocupan menos.
- **Texto entero.** Ningún nombre se corta con «…»: se parte en dos líneas. 320 px funciona.
- **Nada verde.** «Bien» es iris, «atención» ámbar, «mal» rosa.

## Tipografía

- Texto y títulos: la fuente del sistema (SF Pro en iPhone). Títulos grandes en negrita con
  tracking negativo.
- Números: `ui-rounded` (SF Pro Rounded en iPhone, como Salud y Fitness), tabulares (`.readout`,
  `font-num`; `font-mono` apunta a la misma pila).
- Etiquetas (`.spec`): frase normal, 12,5 px, gris. Sin mayúsculas espaciadas.
- Campos de formulario a 16 px como mínimo: iOS hace zoom en cualquier campo menor.
- Sin fuentes web: arranque instantáneo y nada de saltos de fuente.

## Tokens

| Token       | Oscuro       | Claro       | Uso                          |
| ----------- | ------------ | ----------- | ---------------------------- |
| `--bg`      | `#0a0b10`    | `#f6f6f9`   | Lienzo (aurora suave arriba) |
| `--panel`   | `#12131a`    | `#ffffff`   | Tarjetas                     |
| `--panel-2` | `#191a23`    | `#f2f2f6`   | Controles                    |
| `--line`    | blanco 6,5 % | tinta 7,5 % | Filos finos                  |
| `--ink`     | `#f3f4f8`    | `#111226`   | Texto, botón principal       |
| `--signal`  | `#8f93ff`    | `#5856d6`   | Datos destacados, «va bien»  |
| `--accent`  | `#62d0ec`    | `#0a84b8`   | Apoyo                        |
| `--warn`    | `#f6b24e`    | `#a35f00`   | Atención                     |
| `--danger`  | `#ff6d8e`    | `#c8325a`   | Perdida, error               |

El botón principal es tinta: blanco sobre la noche, casi negro sobre el día. Uno por tarjeta.

## Color de sustancia

El color sigue a la familia en toda la app y siempre va junto al nombre. Los nombres de variable
son históricos (`--sub-mint` es cian).

| Variable       | Hex       | Familias              |
| -------------- | --------- | --------------------- |
| `--sub-mint`   | `#1fb7dc` | Incretinas / GLP-1    |
| `--sub-violet` | `#b57cf5` | Eje GH                |
| `--sub-orange` | `#e8683c` | Hormonal, inmune      |
| `--sub-sky`    | `#4a7cf6` | Metabólico, insulinas |
| `--sub-amber`  | `#e59a1d` | Reparación            |
| `--sub-pink`   | `#e0558f` | Sexual                |
| `--sub-lime`   | `#c9aa2c` | Cognitivo, longevidad |

## Kit de indicadores (`src/components/kpi`)

| Pieza      | Qué muestra                                                      |
| ---------- | ---------------------------------------------------------------- |
| `Kpi`      | Etiqueta, número con unidad, `Delta` opcional, línea y gráfico   |
| `Delta`    | Cambio con flecha; bueno en iris, malo en ámbar                  |
| `Meter`    | Barra fina con marca de objetivo y franja esperada               |
| `Ticks`    | Un trazo por día: completa, parcial, perdida, sin nada, descanso |
| `Steps`    | Semanas de ciclo o titulación como escalera; la actual marcada   |
| `Spark`    | Línea mínima con área y punto final                              |
| `DayTrack` | Próximas 24 h: aguja de ahora, horas y cada toma en su color     |

`lab.html?kit=1` los muestra todos juntos.

## Estados de toma

| Estado              | Señal                        |
| ------------------- | ---------------------------- |
| Hecha               | Color de la sustancia, lleno |
| Próxima             | Lleno con halo               |
| Prevista            | Contorno                     |
| Extra (cubre una)   | Contorno con «+»             |
| Perdida o retrasada | Rosa                         |

## Movimiento y teclado

Entradas de 220 ms, hojas con curva de iOS, barras que crecen al aparecer; todo se desactiva con
`prefers-reduced-motion`. Las hojas siguen el viewport visual (`visualViewport`) para no quedar
bajo el teclado.
