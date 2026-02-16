@echo off
REM auto-commit.bat - Script for Windows

echo [33m🔄 กำลังตรวจสอบการเปลี่ยนแปลง...[0m

git status --porcelain > temp.txt
set /p status=<temp.txt
del temp.txt

if not "%status%"=="" (
    echo [32m📝 พบการเปลี่ยนแปลง! กำลัง commit...[0m
    
    git add .
    
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)
    
    git commit -m "Auto commit: %mydate% %mytime%"
    
    echo [32m✅ Commit สำเร็จ![0m
    
    REM ถ้าต้องการ auto-push ด้วย ให้เอา REM ออก
    REM echo [33m📤 กำลัง push...[0m
    REM git push
    REM echo [32m✅ Push สำเร็จ![0m
) else (
    echo [33mℹ️  ไม่มีการเปลี่ยนแปลง[0m
)
