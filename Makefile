.DEFAULT_GOAL := help

# Development
.PHONY: dev desktop-dev tauri-dev

dev: ## Start web dev server (SSR)
	pnpm dev

desktop-dev: ## Start desktop dev server (static)
	pnpm desktop:dev

tauri-dev: ## Start Tauri app in dev mode
	pnpm tauri:dev

# Build
.PHONY: build desktop-build tauri-build

build: ## Build web app (SSR) → dist/
	pnpm build

desktop-build: ## Build desktop app (static) → dist-desktop/
	pnpm desktop:build

tauri-build: ## Build Tauri distributable
	pnpm tauri:build

# Deploy
.PHONY: deploy deploy-linux deploy-windows

deploy: ## Deploy for Linux + Windows
	bash scripts/deploy.sh

deploy-linux: ## Deploy for Linux only (.deb, .AppImage)
	bash scripts/deploy.sh --skip-windows

deploy-windows: ## Deploy for Windows only (.msi, .exe)
	bash scripts/deploy.sh --skip-linux

# Database (web/MySQL)
.PHONY: db-up db-down db-generate db-migrate db-studio

db-up: ## Start MySQL container
	docker compose up -d

db-down: ## Stop MySQL container
	docker compose down

db-generate: ## Generate Drizzle ORM migrations
	pnpm db:generate

db-migrate: ## Apply database migrations
	pnpm db:migrate

db-studio: ## Open Drizzle Studio
	pnpm db:studio

db-sync: ## Sync SQLite (desktop/Tauri) → MySQL (web), Tauri is source of truth
	pnpm db:sync-from-desktop

# Utilities
.PHONY: install preview clean help

install: ## Install dependencies
	pnpm install

preview: ## Preview web build
	pnpm preview

clean: ## Remove build artifacts
	rm -rf dist dist-desktop

help: ## Show available commands
	@echo "HealthDashboard - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
