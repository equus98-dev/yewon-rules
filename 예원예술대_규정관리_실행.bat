@echo off
title 예원예술대학교 규정관리시스템 실행기
chcp 65001 > nul

echo ====================================================================
echo   예원예술대학교 규정관리시스템 로컬 실행 마법사 (남서울대 벤치마킹)
echo ====================================================================
echo.

:: 1. Node.js 경로를 PATH에 선제적 등록
set PATH=C:\Program Files\nodejs;%PATH%

:: 2. Node.js 설치 유무 최종 확인
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [❌ 오류] 컴퓨터에 Node.js가 감지되지 않습니다.
    echo https://nodejs.org/ 에서 LTS 버전을 설치하신 후 다시 실행해 주십시오.
    echo.
    pause
    exit /b
)

echo [🎉 무설정 즉시 실행 가능]
echo 로컬 무설정 데이터베이스(SQLite)와 예원예술대학교 실제 규정 3종 세트가
echo 시스템 내부에 완벽히 주입되어 마이그레이션이 끝났습니다.
echo.
echo 별도의 MySQL 설치나 접속 설정 없이 즉시 더블 클릭만으로 실행됩니다!
echo.
echo ====================================================================
echo.
echo [🚀 시작] 로컬 웹 서버 개발 모드를 가동합니다...
echo.

:: 4. 2초 뒤 브라우저에서 localhost:3000 자동 열기
timeout /t 2 /nobreak > nul
start http://localhost:3000

:: 5. Next.js 개발 서버 실행
npm run dev

pause
