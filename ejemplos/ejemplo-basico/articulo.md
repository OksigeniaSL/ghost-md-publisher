---
title:        "Cómo publicar en Ghost desde Markdown"
slug:         "ejemplo-basico"
excerpt:      "Una pieza de ejemplo que muestra el front-matter soportado por ghost-md-publisher."
tags:         ["Ejemplo", "Tutoriales"]
feature_image: ./encabezado.jpg
status:       draft
author:       jane-doe

# Bloque de fecha (opcional) — útil para contenido fechado o histórico.
historical_date: "Marzo de 2026"

# Product Card (opcional) — se renderiza como tarjeta nativa de Ghost al final.
ad:
  title:        "¿Publicas a menudo en Ghost?"
  product_name: "ghost-md-publisher"
  description:  "Escribe en Markdown y publica con un comando."
  button_text:  "VER EN GITHUB"
  button_url:   "https://github.com/OksigeniaSL/ghost-md-publisher"
  rating:       5

processing:
  enabled:    true
  max_width:  1920
  format:     auto
  quality:    82
---

Este es el cuerpo del artículo en **Markdown**. Puedes usar todo lo habitual: listas,
tablas, enlaces, énfasis, etc.

## Una imagen con pie de foto

El texto alternativo se convierte en el pie de foto:

![Pie de foto de la imagen](./interior_1.jpg)

## Un vídeo embebido

Usa el shortcode `::video` en su propia línea:

::video https://www.youtube.com/watch?v=dQw4w9WgXcQ | Un vídeo de ejemplo

## Listo

Guarda esta carpeta, ejecuta `ghost-publish --dry-run ./` para revisar el payload y,
si todo cuadra, `ghost-publish ./` para crear el draft en Ghost.
