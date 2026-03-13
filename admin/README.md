# SriKumaranSilks Admin Panel

React + Vite based admin dashboard for managing products, stock, orders, users, and coupons.

## Tech Stack

- React 19
- Vite 7
- React Router
- Axios
- Clerk Authentication

## Prerequisites

- Node.js 18+
- npm
- Running backend API from the `server` folder

## Environment Variables

Create a `.env` file inside the `admin` folder:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxx
VITE_API_URL=http://localhost:5000/api
```

Notes:
- `VITE_CLERK_PUBLISHABLE_KEY` is required. The app throws an error if it is missing.
- `VITE_API_URL` is optional because the app defaults to `http://localhost:5000/api`.

## Install

```bash
cd admin
npm install
```

## Run in Development

```bash
npm run dev
```

Vite will print a local URL (usually `http://localhost:5174` or another available port).

## Build and Preview

```bash
npm run build
npm run preview
```

## Backend Requirement

The admin app depends on the backend API. Start the backend in a separate terminal:

```bash
cd server
npm install
npm run dev
```

Expected API base URL for local development:

`http://localhost:5000/api`

## Available Admin Sections

- Dashboard
- Products
- Stock Management
- Users
- Orders
- Coupons

## Auth and Authorization

- Sign in is handled by Clerk.
- API requests include a fresh bearer token through an Axios request interceptor.
- Server-side admin authorization is enforced by backend middleware (`protect`, `admin`).
- Current app code allows any signed-in Clerk user into the UI; tighten this before production.

## Common Issues

### `ERR_CONNECTION_REFUSED` / `Network Error`

If requests to `http://localhost:5000/api/...` fail:

1. Ensure backend is running (`cd server && npm run dev`).
2. Confirm server started on port 5000.
3. Verify `VITE_API_URL` in `admin/.env`.
4. Check backend `.env` values (MongoDB, Clerk secret key).
5. Restart both admin and server after changing env files.

### Missing Clerk key error

If app throws `Missing Clerk Publishable Key`, add `VITE_CLERK_PUBLISHABLE_KEY` in `admin/.env` and restart Vite.

## Project Structure

```text
admin/
	src/
		components/        # Dashboard and management screens
		context/           # Admin context provider
		services/api.js    # Axios instance and API methods
		App.jsx            # Routes and protected screens
		main.jsx           # Clerk and router providers
```
