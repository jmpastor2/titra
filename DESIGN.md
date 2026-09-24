# Titra · Biolab

Titra es tu laboratorio personal: sustancias, pautas, tomas y mejoras con lecturas
precisas, como un instrumento de bancada que se lleva en el bolsillo.

## Mundo visual

- **Laboratorio nocturno.** Lienzo tinta-verdoso casi negro con papel milimetrado muy tenue
  y dos halos bioluminiscentes fijos (menta arriba a la izquierda, violeta arriba a la derecha).
- **Paneles de instrumento.** Superficies opacas con filo fino luminoso y un brillo superior de
  1 px. Los paneles protagonistas llevan marcas de registro en las esquinas.
- **Lecturas.** Todos los números son JetBrains Mono tabular. Las etiquetas son mono en
  mayúsculas pequeñas con tracking amplio, como la serigrafía de un equipo.
- **Titulares** en Space Grotesk, compactos y seguros. El texto corrido usa la fuente del
  sistema (SF Pro en iPhone) por legibilidad.
- **Señal.** Menta luminosa `--signal` es el único color de acción. El resto de color es
  identidad de sustancia, nunca decoración.

## Tokens

| Token       | Oscuro     | Claro      | Uso                   |
| ----------- | ---------- | ---------- | --------------------- |
| `--bg`      | `#050b0d`  | `#eef4f2`  | Lienzo                |
| `--panel`   | `#0b1619`  | `#ffffff`  | Paneles               |
| `--panel-2` | `#10201f`  | `#f1f6f4`  | Controles, pozos      |
| `--line`    | menta 10 % | tinta 10 % | Filos                 |
| `--ink`     | `#e6fbf4`  | `#06201b`  | Texto                 |
| `--signal`  | `#5cf2c4`  | `#0a8f6c`  | Acción, estado activo |

## Color de sustancia

Siete tonos validados para fondo oscuro y claro, también con daltonismo, siempre acompañados
del nombre. El color sigue a la familia de la sustancia en toda la app.

| Tono    | Hex       | Familias              |
| ------- | --------- | --------------------- |
| Menta   | `#12a980` | Incretinas / GLP-1    |
| Violeta | `#8672f0` | Eje GH                |
| Naranja | `#d85c35` | Hormonal, inmune      |
| Cielo   | `#2789c9` | Metabólico, insulinas |
| Ámbar   | `#c07e16` | Reparación            |
| Rosa    | `#d14f8a` | Sexual                |
| Lima    | `#68a52b` | Cognitivo, longevidad |

## Estados de toma

| Estado              | Señal                     |
| ------------------- | ------------------------- |
| Hecha               | Menta con check           |
| Toca ahora          | Ámbar con anillo pulsante |
| Próxima             | Contorno tenue            |
| Perdida o retrasada | Rosa con icono            |

## Movimiento

Entradas de 220 ms con desplazamiento de 6 px, hojas inferiores con curva de iOS y pulso lento
solo en lo que requiere atención ahora. Todo se desactiva con `prefers-reduced-motion`.
