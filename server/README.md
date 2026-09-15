# Backend - NoFoodWaste API

Express + Node.js + MongoDB backend powering NoFoodWaste.

## Modular Structure
```
server/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.model.js
│   │       ├── auth.controller.js
│   │       ├── auth.routes.js
│   │       ├── auth.service.js
│   │       ├── auth.validation.js
│   │       └── auth.utils.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── error.middleware.js
│   ├── routes/
│   │   └── index.js
│   ├── app.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

## Running Backend
```bash
npm install
npm run dev
```
