@echo off
cd /d "C:\Users\Pc\Documents\sgpj-legal\backend"
echo Iniciando SGPJ Legal Backend...
echo Directorio: %CD%
echo.
echo Backend: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload