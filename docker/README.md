# Docker Environment

This directory contains container configurations and orchestration setups for the Focus monorepo applications.

## Services Configuration

| Service | Application Path | Container Name | Port Mapping | Dockerfile |
|---|---|---|---|---|
| **`website`** | `apps/website/` | `focus-website` | `3000:3000` | `docker/Dockerfile.website` |
| **`landing`** | `apps/landing/` | `focus-landing` | `3001:3001` | `docker/Dockerfile.landing` |
| **`backend`** | `apps/backend/` | `focus-backend` | `8080:8080` | `docker/Dockerfile.backend` |

## Usage Commands

### Start All Services

```bash
docker-compose -f docker/docker-compose.yml up --build -d
```

### Start Specific Service

```bash
# Start Landing App
docker-compose -f docker/docker-compose.yml up landing

# Start Web App
docker-compose -f docker/docker-compose.yml up website
```

### Stop Services

```bash
docker-compose -f docker/docker-compose.yml down
```

### View Logs

```bash
docker-compose -f docker/docker-compose.yml logs -f [service-name]
```
