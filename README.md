# Employee Management System

A full-stack Employee Management System built with React + TypeScript on the frontend and FastAPI + MongoDB on the backend.

## Features

- JWT authentication with login/logout
- Role-based access for Admin and User accounts
- Admin-created accounts; Users can view only their own linked employee profile
- Protected dashboard and employee-management routes
- Employee CRUD with search, filter, and pagination
- Employee sorting by ID, name, and salary
- Salaries displayed in Indian rupees
- Department and designation choices, including manager roles
- Automatically generated, unique employee IDs
- Gmail-only employee email addresses and 10-digit phone numbers
- Dashboard summary cards for employee statistics
- MongoDB integration with seed user and employee data
- Swagger/OpenAPI documentation via FastAPI
- Responsive Material UI interface

## Tech Stack

Frontend
- React.js
- TypeScript
- Material UI
- React Router
- Axios

Backend
- Python
- FastAPI
- Pydantic
- PyMongo
- JWT authentication

Testing
- Jest and React Testing Library
- Pytest

## Project Structure

- `frontend/` - React application
- `backend/app/api/routes/` - FastAPI route handlers
- `backend/app/services/` - Authentication, employee, and dashboard services
- `backend/app/db/` - MongoDB access and indexes
- `backend/tests/` - Pytest API and persistence tests
- `docker-compose.yml` - MongoDB container config

## Backend Setup

1. Create and activate a Python virtual environment:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

2. Install backend dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. Configure the local MongoDB connection in the root `.env` file:

   ```env
   MONGODB_URI=mongodb://localhost:27017
   DATABASE_NAME=employee_management
   ```

4. Start the local MongoDB server if it is not already running:

   ```bash
   mongod --dbpath "C:\data\db" --logpath "C:\data\mongod.log" --bind_ip 127.0.0.1 --port 27017
   ```

5. Run the backend:

   ```bash
   .venv\Scripts\python -m uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
   ```

## Frontend Setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the React app:

   ```bash
   npm run dev -- --host 0.0.0.0
   ```

3. Access the frontend at http://localhost:5173

## First Admin Setup

- On a new database, open `/register` and choose **Admin registration** to create the first Admin.
- Once an Admin account exists, public Admin registration is closed. Additional Admins are created by an existing Admin from the **Accounts** page.
- User registration is open, but it requires the existing employee's email address and matching first and last names.
- New registrations choose their own passwords and can sign in immediately. Accounts created by an Admin use a temporary password and must change it at first sign-in.
- Fresh databases seed sample employee records but no login account. Existing databases retain previously created accounts.

## Account Roles

- Public self-registration is disabled. Sign in with the initial Admin account and open **Accounts** to create accounts.
- An Admin can create another Admin account or a User account.
- A User account must use an email address already assigned to an employee record.
- Newly created accounts must change their temporary password at first sign-in.
- Users can view only their own employee profile; employee management and dashboard features are Admin-only.

## API Base URL

The frontend uses:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Local MongoDB Notes

- This project is configured to use local MongoDB by default.
- The connection string is `mongodb://localhost:27017`.
- MongoDB Compass and MongoDB Shell can both be used to inspect the `users` and `employees` collections.
- On Windows, double-click `Start-Employee-Management.bat` from the project folder to start MongoDB (if needed), the backend, and the frontend. The launcher opens the app at http://localhost:5173.

## Testing

Backend:

```bash
.venv\Scripts\python -m pytest backend/tests -q
```

The backend tests require local MongoDB and use a separate `employee_management_test` database, which is removed after the test run.

Frontend:

```bash
cd frontend
npm test
```

## Swagger UI

Open:

```text
http://localhost:8000/docs
```

## REST API

- `POST /api/auth/login` - authenticate and receive a JWT
- `POST /api/auth/register/user` - register a User linked to an existing employee
- `POST /api/auth/register/admin` - bootstrap the first Admin account
- `POST /api/auth/change-password` - change a first-login temporary password
- `POST /api/admin/accounts` - create an Admin or linked User account (Admin only)
- `GET /api/employees` - list employees; supports `search`, `department`, `status`, `page`, and `limit`, and returns `items`, `total`, `page`, and `limit`
- `GET /api/employees/me` - get the signed-in User's own employee profile
- `POST /api/employees` - create an employee
- `GET /api/employees/{id}` - get one employee
- `PUT /api/employees/{id}` - update an employee
- `DELETE /api/employees/{id}` - delete an employee
- `GET /api/employees/departments` - list departments for filtering
- `GET /api/dashboard/stats` - total, active, and inactive counts

## Notes

- The backend requires MongoDB and reports a connection error if it is unavailable; employee records are never stored in a temporary in-memory fallback.
- For production, make sure to configure a secure `SECRET_KEY` and a real MongoDB instance.
