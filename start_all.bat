@echo off
REM Launch all three EduPath services in separate windows.
REM Run the one-time setup first:  pip install (ml-service) and npm install (backend, frontend).

echo Starting EduPath (MERN)...
start "EduPath ML service" cmd /k "cd ml-service && uvicorn main:app --port 8000"
start "EduPath backend"    cmd /k "cd backend && npm start"
start "EduPath frontend"   cmd /k "cd frontend && npm run dev"
echo.
echo Opened 3 windows. When they are ready, open:  http://127.0.0.1:5173
