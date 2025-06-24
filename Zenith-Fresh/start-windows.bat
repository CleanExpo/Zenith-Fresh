@echo off
echo Starting Zenith Fresh on Windows...
echo.

REM Clear Next.js cache
if exist ".next" (
    echo Clearing Next.js cache...
    rmdir /s /q ".next"
)

REM Clear node_modules cache if needed
if exist "node_modules\.cache" (
    echo Clearing node modules cache...
    rmdir /s /q "node_modules\.cache"
)

echo.
echo Starting development server...
echo You can access the application at: http://localhost:3000
echo.
echo Master Admin Credentials:
echo Username: zenith_master
echo Password: ZenithMaster2024!
echo.
echo Staff Test Accounts:
echo - staff_1 / StaffTest2024!
echo - staff_2 / StaffTest2024!
echo - qa_lead / QALead2024!
echo - dev_test / DevTest2024!
echo.

npm run dev