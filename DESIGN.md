# Titra

Titra es tu laboratorio personal: sustancias, pautas, tomas y mejoras con lecturas
precisas, sencillas y a la vista, como un instrumento que se lleva en el bolsillo.

## Mundo visual

- **Noche grafito.** Lienzo casi negro con matiz azul-tinta y dos halos suaves fijos (índigo
  arriba a la izquierda, orquídea arriba a la derecha). Sin cuadrícula ni decoración: cada
  elemento lleva un dato. Nada verde.
- **Paneles.** Superficies opacas con filo fino y un brillo superior de 1 px. Un número grande
  por tarjeta, una línea de apoyo y gráficos pequeños.
- **Lecturas.** Todos los números son JetBrains Mono tabular. Las etiquetas pequeñas son mono
  en mayúsculas con tracking amplio y pueden partirse en dos líneas; nunca se cortan con «…»
  cuando llevan información (nombres de viales, mezclas, pautas).
- **Titulares** en Space Grotesk, compactos y seguros. El texto corrido usa la fuente del
  sistema (SF Pro en iPhone) por legibilidad. Campos de formulario a 16 px mínimo: iOS hace
  zoom en cualquier campo menor.
- **Señal.** Índigo-periwinkle `--signal` es el único color de acción y de «bien». El cian
  `--accent` acompaña. El resto de color es identidad de sustancia, nunca decoración.

## Tokens

| Token       | Oscuro      | Claro     | Uso                       |
| ----------- | ----------- | --------- | ------------------------- |
| `--bg`      | `#07080e`   | `#f4f5fb` | Lienzo                    |
| `--panel`   | `#0f111b`   | `#ffffff` | Paneles                   |
| `--panel-2` | `#151826`   | `#f0f2fa` | Controles, pozos          |
| `--line`    | índigo 10 % | tinta 9 % | Filos                     |
| `--ink`     | `#eef0fb`   | `#0d1030` | Texto                     |
| `--signal`  | `#9fadff`   | `#4a52e0` | Acción, activo, «va bien» |
| `--accent`  | `#5fd0f0`   | `#0a84b8` | Apoyo                     |
| `--warn`    | `#ffb454`   | `#9a5a00` | Atención                  |
| `--danger`  | `#ff6f98`   | `#c0345b` | Error, perdida            |

## Color de sustancia

Tonos validados para fondo oscuro y claro, siempre acompañados del nombre. El color sigue a
la familia de la sustancia en toda la app. Los nombres de variable son históricos
(`--sub-mint` ahora es cian).

| Variable       | Hex       | Familias              |
| -------------- | --------- | --------------------- |
| `--sub-mint`   | `#1fb7dc` | Incretinas / GLP-1    |
| `--sub-violet` | `#b57cf5` | Eje GH                |
| `--sub-orange` | `#e8683c` | Hormonal, inmune      |
| `--sub-sky`    | `#4a7cf6` | Metabólico, insulinas |
| `--sub-amber`  | `#e59a1d` | Reparación            |
| `--sub-pink`   | `#e0558f` | Sexual                |
| `--sub-lime`   | `#c9aa2c` | Cognitivo, longevidad |

## Estados de toma

| Estado              | Señal                     |
| ------------------- | ------------------------- |
| Hecha               | Índigo con check          |
| Toca ahora          | Ámbar con anillo pulsante |
| Próxima             | Contorno tenue            |
| Extra (cubre una)   | Contorno con «+»          |
| Perdida o retrasada | Rosa con icono            |

## KPIs

Anillo de progreso (`components/kpi/Ring`), rachas, mapa de calor de adherencia, barras de
consumo y días de cobertura. Cada indicador responde a una pregunta («¿voy bien?», «¿cuándo
me quedo sin?», «¿funciona?») con datos que ya existen, sin peticiones nuevas.

## Movimiento

Entradas de 220 ms con desplazamiento de 6 px, hojas inferiores con curva de iOS y pulso lento
solo en lo que requiere atención ahora. Todo se desactiva con `prefers-reduced-motion`.

## Teclado en iOS

Las hojas siguen el viewport visual (`visualViewport`) para no quedar bajo el teclado.
