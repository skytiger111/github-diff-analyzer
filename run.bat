@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title GitHub Diff Analyzer

echo ========================================
echo       GitHub Diff Analyzer 啟動器
echo ========================================
echo 此工具會分析 GitHub 專案的變更並產出人話版 CSV 報告。
echo.

:REPO_INPUT
set /p REPO_URL="請輸入 GitHub 專案網址 (URL): "
if "%REPO_URL%"=="" (
    echo [!] 網址不能為空。
    goto REPO_INPUT
)

echo.
echo 請選擇分析模式:
echo [1] 分析最新一筆 commit (預設)
echo [2] 列出最近 N 筆 commit 清單
echo [3] 分析特定一筆 commit (SHA)
echo [4] 比對兩個 commit 範圍 (sha1..sha2)
echo.

set /p MODE="請輸入編號 [1-4]: "
if "%MODE%"=="" set MODE=1

echo.
if "%MODE%"=="1" (
    node src/index.js --repo "%REPO_URL%"
) else if "%MODE%"=="2" (
    set /p COUNT="要列出幾筆 [預設 10]: "
    if "!COUNT!"=="" set COUNT=10
    node src/index.js --repo "%REPO_URL%" --list !COUNT!
) else if "%MODE%"=="3" (
    set /p SHA="請輸入 Commit SHA: "
    node src/index.js --repo "%REPO_URL%" --commit !SHA!
) else if "%MODE%"=="4" (
    set /p RANGE="請輸入範圍 (例如 a1b2c3d..e5f6g7h): "
    node src/index.js --repo "%REPO_URL%" --compare !RANGE!
) else (
    echo [!] 無效的編號編號。
    goto REPO_INPUT
)

echo.
echo ========================================
echo 任務結束！報告已儲存在此目錄下。
pause
