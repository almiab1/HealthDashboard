# Guía de Contribución

Este proyecto utiliza el flujo de trabajo **GitFlow** para gestionar el desarrollo.

## Estructura de Ramas

### Ramas Principales

| Rama | Propósito |
|------|-----------|
| `main` | Código en producción, siempre estable |
| `develop` | Rama de integración para desarrollo |

### Ramas de Soporte

| Prefijo | Propósito | Se crea desde | Se fusiona a |
|---------|-----------|---------------|--------------|
| `feature/*` | Nuevas funcionalidades | develop | develop |
| `release/*` | Preparar nueva versión | develop | main + develop |
| `hotfix/*` | Corrección urgente en producción | main | main + develop |

## Flujo de Trabajo

### Crear una nueva funcionalidad

```bash
# Desde develop, crear rama de feature
git checkout develop
git checkout -b feature/nombre-funcionalidad

# Trabajar en la funcionalidad...
# Hacer commits con mensajes descriptivos

# Cuando esté lista, fusionar a develop
git checkout develop
git merge --no-ff feature/nombre-funcionalidad
git branch -d feature/nombre-funcionalidad
git push origin develop
```

### Preparar un release

```bash
# Desde develop, crear rama de release
git checkout develop
git checkout -b release/1.0.0

# Hacer ajustes finales (bump version, changelog, etc.)

# Fusionar a main y taggear
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Version 1.0.0"

# Fusionar también a develop
git checkout develop
git merge --no-ff release/1.0.0

# Limpiar
git branch -d release/1.0.0
git push origin main develop --tags
```

### Crear un hotfix

```bash
# Desde main, crear rama de hotfix
git checkout main
git checkout -b hotfix/descripcion-fix

# Corregir el problema...

# Fusionar a main y taggear
git checkout main
git merge --no-ff hotfix/descripcion-fix
git tag -a v1.0.1 -m "Hotfix 1.0.1"

# Fusionar también a develop
git checkout develop
git merge --no-ff hotfix/descripcion-fix

# Limpiar
git branch -d hotfix/descripcion-fix
git push origin main develop --tags
```

## Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan código)
- `refactor:` Refactorización de código
- `test:` Añadir o modificar tests
- `chore:` Tareas de mantenimiento

**Ejemplos:**
```
feat: add user authentication
fix: resolve login redirect issue
docs: update installation instructions
refactor: simplify data processing logic
```

## Pull Requests

1. Crea tu rama desde `develop` (o `main` para hotfixes)
2. Asegúrate de que el código compile sin errores
3. Describe claramente los cambios en el PR
4. Solicita revisión de código
5. Una vez aprobado, fusiona usando "Squash and merge" o "Merge commit"
