# README

## Prerequisites

Before you begin, ensure you have installed:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Project Structure

```
.
├── app.js                  # Main application entry point
├── package.json           # Root dependencies
├── back/
│   ├── server.js         # Backend test server
│   ├── package.json      # Backend dependencies
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── migrations/   # Database migrations
│   └── src/
│       ├── controllers/  # Business logic
│       ├── middlewares/  # Custom middleware
│       └── routes/       # API routes
├── front/                # Frontend static files
├── Dockerfile
└── docker-compose.yml
```

## Quick Start

1. Clone the repository
```bash
git clone 
cd 
```

2. Start the application using Docker Compose
```bash
docker-compose up --build
```

The application will be available at:
- Web Application: http://localhost:3001
- Database: localhost:5432 (if you need direct access)

### Making Changes

1. Stop the application:
```bash
docker-compose down
```

2. Make your changes to the code

3. Rebuild and restart:
```bash
docker-compose up --build
```

### Database Changes

When modifying the database schema:

1. Update `back/prisma/schema.prisma`

2. Generate new migration:
```bash
docker exec -it banking-app npx prisma migrate dev --schema=/usr/src/app/back/prisma/schema.prisma --name your_migration_name
```

## Testing

The backend can be tested independently using Postman:

1. Start only the backend server:
```bash
cd back
npm install
node server.js
```

2. Use the following base URL for API requests:
```
http://localhost:3001/api
```

## API Routes

### Authentication
- POST `/api/signup`: Create new user account
- POST `/api/login`: User login
- POST `/api/logout`: User logout (protected)

### Bank Accounts
- GET `/api/accounts`: Get user's accounts (protected)
- POST `/api/accounts`: Create new account (protected)
- DELETE `/api/accounts/:accountId`: Delete account (protected)

### Transactions
- GET `/api/accounts/:accountId/transactions`: Get transactions (protected)
- POST `/api/accounts/:accountId/transactions`: Create transaction (protected)
- GET `/api/accounts/:accountId/transactions/history`: Get filtered history (protected)
- GET `/api/accounts/:accountId/transactions/download`: Download CSV (protected)

### User Profile
- GET `/api/profile`: Get user profile (protected)
- PUT `/api/profile`: Update user profile (protected)
