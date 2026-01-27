# Markwave Dashboard

A React dashboard for managing users and referrals in the Markwave system.

## Features

- **Users Tab**: View existing customers with verification status
- **Referrals Tab**: View and manage new referrals with add user functionality
- **Mobile-style Add User Modal**: Clean popup interface for adding new users
- **Environment Detection**: Automatically connects to localhost or Cloud Run based on environment
- **Real-time API Status**: Shows backend connectivity status
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 16+ 
- Backend API running (see Backend Setup section)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Backend Setup

The dashboard automatically detects the environment and connects to the appropriate API:

### Local Development
- Starts backend on `http://localhost:8000`
- Navigate to `/Users/markwave/projects/markwave_backend/backend`
- Run: `python main.py`

### Cloud Run (Production)
- Automatically connects to: `https://markwave-live-services-650581102834.asia-south1.run.app`

## API Endpoints Used

- `GET /Users/customers` - Fetch existing customers
- `GET /Users/referrals` - Fetch new referrals  
- `POST /Users/` - Create new user
- `POST /users/verify` - Verify user
- `GET /health` - Check API health

## Project Structure

```
src/
├── components/
│   ├── UsersTab.tsx          # Existing customers view
│   ├── ReferralsTab.tsx     # Referrals view with add functionality
│   ├── AddUserModal.tsx     # Mobile-style add user popup
│   └── HealthStatus.tsx     # API connectivity indicator
├── config/
│   └── api.ts               # API configuration and endpoints
├── services/
│   └── api.ts               # API service functions
├── types/
│   └── index.ts             # TypeScript type definitions
├── App.tsx                  # Main dashboard with tabs
└── index.css                # Tailwind CSS styles
```

## Technologies Used

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

## Build for Production

```bash
npm run build
```
