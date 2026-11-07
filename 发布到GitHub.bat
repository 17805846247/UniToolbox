@echo off
cd /d "C:\Users\Administrator\Documents\HBuilderProjects\UniToolbox"
echo Current dir: %cd%
echo.
git status -s
echo.
echo ============================================================
echo  Pushing to: https://github.com/17805846247/UniToolbox.git
echo  A GitHub login / authorize window will pop up.
echo  Sign in with your GitHub account and click Authorize.
echo  (No token needed. If no window appears, check the taskbar.)
echo ============================================================
echo.
git push -u origin main
echo.
if %errorlevel%==0 (
  echo [OK] Pushed successfully! Open:
  echo https://github.com/17805846247/UniToolbox
) else (
  echo [FAIL] Push failed. Check the error message above.
)
pause
