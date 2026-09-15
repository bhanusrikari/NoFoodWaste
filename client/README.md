# Frontend - NoFoodWaste React Client

React + Vite frontend powering NoFoodWaste.

## Structure
```
client/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── DonorDashboard.jsx
│   │   ├── VolunteerDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── features/
│   │   └── auth/
│   │       ├── authService.js
│   │       └── authContext.jsx
│   ├── routes/
│   │   └── ProtectedRoute.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Running Frontend
```bash
npm install
npm run dev
```
Runs on `http://localhost:5173`.
