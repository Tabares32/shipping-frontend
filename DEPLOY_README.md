What I changed and how to deploy

1) Added a backend FastAPI app in /backend
   - Endpoints:
     - POST /auth/login  {username,password} -> {token,username,role}
     - GET /auth/me      (requires Authorization: Bearer <token>)
     - POST /users       (admin only)
     - GET/POST /storage/{key} (requires Authorization header)
   - Seeded admin: username=admin password=adminpassword
   - To deploy on Render: create a new Web Service, set the start command:
       gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT --workers 1
     and set environment variable APP_SECRET to a strong secret.
2) Frontend:
   - It remains the original project with a small change: AuthLogin will use a remote backend if you set the environment variable REACT_APP_BACKEND_URL to your backend URL (for example https://shipping-backend-kgm5.onrender.com).
   - On Vercel, set REACT_APP_BACKEND_URL to your Render URL (no trailing slash).
3) To run locally:
   - Backend: cd backend; pip install -r requirements.txt; gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
   - Frontend: cd project root; npm install; npm start
4) I included the updated project zip in the workspace for download.
