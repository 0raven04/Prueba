# 🚀 Proyecto de Pruebas DevOps

Proyecto sencillo para practicar GitHub Actions, protección de ramas y CI/CD.

## Estructura del Proyecto

```
Pruebas/
├── .github/
│   └── workflows/
│       ├── ci.yml           # Pipeline CI (lint → test → build)
│       ├── deploy.yml       # Deploy a GitHub Pages
│       └── pr-greeting.yml  # Saludo automático en PRs
├── index.html               # Página principal
├── app.js                   # Lógica de la aplicación
├── app.test.js              # Tests unitarios (Jest)
├── package.json             # Configuración npm
└── .gitignore
```

## Cómo Usar

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar tests
```bash
npm test
npm run test:coverage
```

### 3. Ejecutar lint
```bash
npm run lint
```

## Workflows de GitHub Actions

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| **CI Pipeline** | Push/PR a `main` y `develop` | Lint → Tests (Node 18, 20, 22) → Build |
| **Deploy** | Push a `main` o manual | Deploya a GitHub Pages |
| **PR Greeting** | Abrir un PR | Comenta un saludo automático |

## Conceptos DevOps para Practicar

### GitHub Actions
- ✅ Workflows con múltiples jobs
- ✅ Matrix strategy (múltiples versiones de Node.js)
- ✅ Job dependencies (`needs`)
- ✅ Upload de artefactos
- ✅ `workflow_dispatch` (ejecución manual)
- ✅ Uso de `github-script` para automatización
- ✅ Concurrency control

### Protección de Ramas (Configurar en Settings → Branches)
- Requerir PR para merge a `main`
- Requerir que pasen los status checks (CI Pipeline)
- Requerir revisiones de código
- No permitir force push
- Requerir que la rama esté actualizada antes de merge

### Flujo de Trabajo Sugerido
1. Crear rama `develop` desde `main`
2. Configurar protección en `main`
3. Hacer cambios en una rama feature
4. Abrir PR a `develop` → ver CI corriendo
5. Merge a `develop` → ver CI corriendo
6. Abrir PR de `develop` a `main` → ver CI + greeting bot
7. Merge a `main` → ver deploy automático
# Prueba de CI
