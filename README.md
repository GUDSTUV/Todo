# Todu - Modern Todo Application

A comprehensive, production-ready todo application built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- ✅ **Task Management**: Create, read, update, and delete tasks with rich metadata
- 📋 **Lists & Organization**: Organize tasks into custom lists with colors and icons
- 🏷️ **Tags & Priorities**: Categorize tasks with tags and priority levels
- ☑️ **Subtasks**: Break down complex tasks into manageable subtasks
- 🔍 **Search & Filter**: Powerful search and filtering capabilities
- 📱 **Responsive Design**: Mobile-first, works great on all devices
- 🔐 **Secure Authentication**: JWT-based auth with password hashing
- 🎨 **Modern UI**: Clean, intuitive interface built with Tailwind CSS
- ⚡ **Real-time Updates**: Optimistic updates with React Query
- 🔔 **Toast Notifications**: User-friendly feedback for all actions

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for server state management
- **Zustand** for client state management
- **React Router** for navigation
- **Axios** for API calls
- **date-fns** for date manipulation
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Helmet** for security headers
- **Express Rate Limit** for API protection
- **Express Validator** for input validation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Todu
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Frontend**
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on http://localhost:5000

3. **Start Frontend**
   ```bash
   cd client
   npm run dev
   ```
   Client runs on http://localhost:5173

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to account
- `POST /api/auth/refresh` - Refresh access token

### Task Endpoints

- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/bulk` - Bulk update tasks
- `GET /api/tasks/stats` - Get task statistics

### List Endpoints

- `GET /api/lists` - Get all lists
- `GET /api/lists/:id` - Get single list
- `POST /api/lists` - Create new list
- `PATCH /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list
- `PATCH /api/lists/:id/archive` - Archive/unarchive list
- `PATCH /api/lists/bulk` - Bulk update lists

## Project Structure

```
Todu/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── api/           # API client and endpoints
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Feature-specific components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state stores
│   │   └── utils/         # Utility functions
│   └── package.json
│
└── server/                # Backend Node.js application
    ├── src/
    │   ├── config/        # Configuration files
    │   ├── controllers/   # Route controllers
    │   ├── middleware/    # Express middleware
    │   ├── models/        # Mongoose models
    │   ├── routes/        # API routes
    │   └── server.ts      # Entry point
    └── package.json
```

## Security Features

- Password hashing with bcrypt (10+ rounds)
- JWT-based authentication
- HTTP-only secure headers (Helmet)
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- XSS protection

## Development

### Code Style

- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting (recommended)

### Testing (TODO)

- Unit tests with Jest
- Integration tests with Supertest
- E2E tests with Cypress

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.



## Author

Built with ❤️ by David Sedzro as a comprehensive example of modern full-stack development.
