# Ejemplo básico

Carpeta de ejemplo para `ghost-md-publisher`.

```
ejemplo-basico/
├── articulo.md       # front-matter + cuerpo en markdown
├── encabezado.jpg    # feature image (añade la tuya)
└── interior_1.jpg    # imagen del cuerpo (añade la tuya)
```

Pasos:

1. Añade tus imágenes (`encabezado.jpg`, `interior_1.jpg`) en esta carpeta, o quita esas referencias del `articulo.md`.
2. Configura `.env` en la raíz del proyecto (copia de `.env.example`).
3. Dry run: `node ../../publish.js --dry-run ./`
4. Publicar: `node ../../publish.js ./`
5. Abre el enlace al editor de Ghost que imprime, revisa el draft y pulsa **Publish**.
