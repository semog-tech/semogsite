@echo off
rem ============================================
rem  Abre o site da Semog para validacao
rem  - Com Python: sobe servidor local (ideal)
rem  - Sem Python: abre direto no navegador
rem ============================================
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
  echo Servidor local em http://localhost:8347  (Ctrl+C para encerrar)
  start "" "http://localhost:8347/index.html"
  python -m http.server 8347
) else (
  start "" "%~dp0index.html"
)
