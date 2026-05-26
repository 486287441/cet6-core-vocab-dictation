@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  六级核心词背诵检测站
echo  ----------------------
echo  目录: %CD%
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 Python。请先安装 Python 3 并加入 PATH。
  echo        https://www.python.org/downloads/
  pause
  exit /b 1
)

set PORT=8888
echo  启动本地服务: http://localhost:%PORT%/
echo  按 Ctrl+C 可停止服务
echo.

start "" "http://localhost:%PORT%/"

python -m http.server %PORT%

pause
