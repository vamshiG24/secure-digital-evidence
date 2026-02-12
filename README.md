# Secure Digital Evidence Management System

A production-level, cybersecurity-focused MERN stack application for law enforcement to securely manage digital evidence.

## Features

- **Authentication & Authorization**: Role-based access (Admin, Investigator, Analyst) with JWT and bcrypt.
- **Secure Evidence Management**: File upload with SHA-256 integrity hashing.
- **Case Management**: Create, assign, and track cases.
- **Audit Logging**: Tracks all user actions with IP and User-Agent.
- **Real-time Notifications**: Socket.io integration for instant updates.
- **Modern UI**: Built with React, Tailwind CSS, and Lucide Icons.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Axios, Socket.io-client
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, Multer
- **Security**: Helmet, CORS, JWT, Bcrypt, SHA-256 Hashing

## Prerequisites

- Node.js (v14+)
- MongoDB (Local or Atlas)

## Installation & Setup

1. **Clone the repository** (if applicable)

2. **Backend Setup**

   ```bash
   cd server
   npm install
   ```

   - Create a `.env` file in `server/` with the following:
     ```env
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/secure-evidence-db
     JWT_SECRET=your_super_secret_key
     ```
   - Seed the database with initial users:
     ```bash
     npm run seed
     ```

   - Start the server:
     ```bash
     npm run dev
     ```

3. **Frontend Setup**

   ```bash
   cd client
   npm install
   npm run dev
   ```

## Usage

1. **Login**: Use the seeded credentials.
   - **Admin**: `admin@secureevidence.com` / `password123`
   - **Investigator**: `investigator@secureevidence.com` / `password123`
2. **Dashboard**: View statistics and cases.
3. **Create Case**: (Admin) Create a new case and assign it.
4. **Upload Evidence**: Go to a case detail page and upload files.
5. **Verify**: Check the file hash in the evidence list.

## Folder Structure

```
/server
  /config         # DB connection
  /controllers    # Route logic
  /middlewares    # Auth & Audit middleware
  /models         # Mongoose models
  /routes         # API routes
  /uploads        # File storage
  server.js       # Entry point

/client
  /src
    /components   # Reusable UI components
    /context      # Auth & Socket context
    /pages        # Application pages
    App.jsx       # Main component
```

## JSON Sample Data (API)

**POST /api/cases**
```json
{
  "title": "Cyber Extortion Case #402",
  "description": "Investigation into ransomware attack on City Hospital.",
  "priority": "Critical"
}
```

## UI Screenshots Description

1. **Login Page**: Dark themed, centered card with "System Access" title and Shield icon. Input fields for Email and Password.
2. **Dashboard**: Dark sidebar/navbar. Top cards showing Total Cases, Open, In Progress. Main table listing cases with status badges (Yellow for Open, Green for Closed).
3. **Case Detail**: Header with Case Title and Status. Left side shows description and evidence list. Right side has drag-and-drop style upload box.

---

**Developed for Secure Digital Evidence Management**
