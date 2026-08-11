
# Smart Fund Management System

This repository contains a React frontend and a Node/Express backend with PostgreSQL storage and Gemini/OpenAI analysis.

## Running the code

Install dependencies:

```bash
pnpm install
```

Local frontend development:

```bash
pnpm dev
```

Local backend development:

```bash
pnpm --dir server dev
```

## Deployment Ready

Build both client and server:

```bash
pnpm build
```

Start backend in production mode:

```bash
pnpm start
```

### Docker

Build and run with Docker:

```bash
docker-compose up --build
```

The backend will be available at `http://localhost:4000`.

## Environment variables

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `JWT_SECRET`
- `GEMINI_API_KEY` or `OPENAI_API_KEY`

## API Endpoints

- `POST /api/login`
- `GET /api/members`
- `POST /api/members`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/announcements`
- `POST /api/announcements`
- `GET /api/summary`
- `POST /api/analysis`
  