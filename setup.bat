@echo off

REM Create project directory
rmdir /s /q zenith-docker
mkdir zenith-docker
cd zenith-docker

REM Create package.json
echo {> package.json
echo   "name": "zenith-docker",>> package.json
echo   "private": true,>> package.json
echo   "version": "0.0.0",>> package.json
echo   "type": "module",>> package.json
echo   "scripts": {>> package.json
echo     "dev": "vite",>> package.json
echo     "build": "tsc && vite build",>> package.json
echo     "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",>> package.json
echo     "preview": "vite preview">> package.json
echo   },>> package.json
echo   "dependencies": {>> package.json
echo     "react": "^18.2.0",>> package.json
echo     "react-dom": "^18.2.0">> package.json
echo   },>> package.json
echo   "devDependencies": {>> package.json
echo     "@types/react": "^18.2.43",>> package.json
echo     "@types/react-dom": "^18.2.17",>> package.json
echo     "@typescript-eslint/eslint-plugin": "^6.14.0",>> package.json
echo     "@typescript-eslint/parser": "^6.14.0",>> package.json
echo     "@vitejs/plugin-react": "^4.2.1",>> package.json
echo     "autoprefixer": "^10.4.17",>> package.json
echo     "eslint": "^8.55.0",>> package.json
echo     "eslint-plugin-react-hooks": "^4.6.0",>> package.json
echo     "eslint-plugin-react-refresh": "^0.4.5",>> package.json
echo     "postcss": "^8.4.35",>> package.json
echo     "tailwindcss": "^3.4.1",>> package.json
echo     "typescript": "^5.2.2",>> package.json
echo     "vite": "^5.0.8">> package.json
echo   }>> package.json
echo }>> package.json

REM Create tsconfig.json
echo {> tsconfig.json
echo   "compilerOptions": {>> tsconfig.json
echo     "target": "ES2020",>> tsconfig.json
echo     "useDefineForClassFields": true,>> tsconfig.json
echo     "lib": ["ES2020", "DOM", "DOM.Iterable"],>> tsconfig.json
echo     "module": "ESNext",>> tsconfig.json
echo     "skipLibCheck": true,>> tsconfig.json
echo     "moduleResolution": "bundler",>> tsconfig.json
echo     "allowImportingTsExtensions": true,>> tsconfig.json
echo     "resolveJsonModule": true,>> tsconfig.json
echo     "isolatedModules": true,>> tsconfig.json
echo     "noEmit": true,>> tsconfig.json
echo     "jsx": "react-jsx",>> tsconfig.json
echo     "strict": true,>> tsconfig.json
echo     "noUnusedLocals": true,>> tsconfig.json
echo     "noUnusedParameters": true,>> tsconfig.json
echo     "noFallthroughCasesInSwitch": true>> tsconfig.json
echo   },>> tsconfig.json
echo   "include": ["src"],>> tsconfig.json
echo   "references": [{ "path": "./tsconfig.node.json" }]>> tsconfig.json
echo }>> tsconfig.json

REM Create tsconfig.node.json
echo {> tsconfig.node.json
echo   "compilerOptions": {>> tsconfig.node.json
echo     "composite": true,>> tsconfig.node.json
echo     "skipLibCheck": true,>> tsconfig.node.json
echo     "module": "ESNext",>> tsconfig.node.json
echo     "moduleResolution": "bundler",>> tsconfig.node.json
echo     "allowSyntheticDefaultImports": true>> tsconfig.node.json
echo   },>> tsconfig.node.json
echo   "include": ["vite.config.ts"]>> tsconfig.node.json
echo }>> tsconfig.node.json

REM Create vite.config.ts
echo import { defineConfig } from 'vite'> vite.config.ts
echo import react from '@vitejs/plugin-react'>> vite.config.ts
echo.>> vite.config.ts
echo export default defineConfig({>> vite.config.ts
echo   plugins: [react()],>> vite.config.ts
echo   server: {>> vite.config.ts
echo     host: '0.0.0.0',>> vite.config.ts
echo     port: 5173,>> vite.config.ts
echo   },>> vite.config.ts
echo })>> vite.config.ts

REM Create index.html
echo ^<!DOCTYPE html^>> index.html
echo ^<html lang="en"^>>> index.html
echo   ^<head^>>> index.html
echo     ^<meta charset="UTF-8" /^>>> index.html
echo     ^<link rel="icon" type="image/svg+xml" href="/vite.svg" /^>>> index.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>>> index.html
echo     ^<title^>Zenith Docker^</title^>>> index.html
echo   ^</head^>>> index.html
echo   ^<body^>>> index.html
echo     ^<div id="root"^>^</div^>>> index.html
echo     ^<script type="module" src="/src/main.tsx"^>^</script^>>> index.html
echo   ^</body^>>> index.html
echo ^</html^>>> index.html

REM Create src directory
mkdir src

REM Create src/index.css
echo @tailwind base;> src\index.css
echo @tailwind components;>> src\index.css
echo @tailwind utilities;>> src\index.css

REM Create src/App.tsx
echo import { useState } from 'react'> src\App.tsx
echo.>> src\App.tsx
echo function App() {>> src\App.tsx
echo   const [count, setCount] = useState(0)>> src\App.tsx
echo.>> src\App.tsx
echo   return (>> src\App.tsx
echo     ^<div className="min-h-screen bg-gray-900 text-white"^>>> src\App.tsx
echo       ^<div className="container mx-auto px-4 py-8"^>>> src\App.tsx
echo         ^<h1 className="text-4xl font-bold mb-8"^>Zenith Docker^</h1^>>> src\App.tsx
echo         ^<div className="bg-gray-800 p-6 rounded-lg shadow-lg"^>>> src\App.tsx
echo           ^<p className="text-xl mb-4"^>Count: {count}^</p^>>> src\App.tsx
echo           ^<button>> src\App.tsx
echo             onClick={() =^> setCount(count + 1)}>> src\App.tsx
echo             className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">> src\App.tsx
echo           ^>Increment^</button^>>> src\App.tsx
echo         ^</div^>>> src\App.tsx
echo       ^</div^>>> src\App.tsx
echo     ^</div^>>> src\App.tsx
echo   )>> src\App.tsx
echo }>> src\App.tsx
echo.>> src\App.tsx
echo export default App>> src\App.tsx

REM Create src/main.tsx
echo import React from 'react'> src\main.tsx
echo import ReactDOM from 'react-dom/client'>> src\main.tsx
echo import App from './App'>> src\main.tsx
echo import './index.css'>> src\main.tsx
echo.>> src\main.tsx
echo ReactDOM.createRoot(document.getElementById('root')!).render(>> src\main.tsx
echo   ^<React.StrictMode^>>> src\main.tsx
echo     ^<App /^>>> src\main.tsx
echo   ^</React.StrictMode^>>> src\main.tsx
echo )>> src\main.tsx

REM Create tailwind.config.js
echo /** @type {import('tailwindcss').Config} */> tailwind.config.js
echo export default {>> tailwind.config.js
echo   content: [>> tailwind.config.js
echo     "./index.html",>> tailwind.config.js
echo     "./src/**/*.{js,ts,jsx,tsx}",>> tailwind.config.js
echo   ],>> tailwind.config.js
echo   theme: {>> tailwind.config.js
echo     extend: {},>> tailwind.config.js
echo   },>> tailwind.config.js
echo   plugins: [],>> tailwind.config.js
echo }>> tailwind.config.js

REM Create postcss.config.js
echo export default {> postcss.config.js
echo   plugins: {>> postcss.config.js
echo     tailwindcss: {},>> postcss.config.js
echo     autoprefixer: {},>> postcss.config.js
echo   },>> postcss.config.js
echo }>> postcss.config.js

REM Create Dockerfile
echo FROM node:18-alpine> Dockerfile
echo.>> Dockerfile
echo WORKDIR /app>> Dockerfile
echo.>> Dockerfile
echo COPY package*.json ./>> Dockerfile
echo RUN npm install>> Dockerfile
echo.>> Dockerfile
echo COPY . .>> Dockerfile
echo.>> Dockerfile
echo EXPOSE 5173>> Dockerfile
echo.>> Dockerfile
echo CMD ["npm", "run", "dev"]>> Dockerfile

REM Create .gitignore
echo # Logs> .gitignore
echo logs>> .gitignore
echo *.log>> .gitignore
echo npm-debug.log*>> .gitignore
echo yarn-debug.log*>> .gitignore
echo yarn-error.log*>> .gitignore
echo pnpm-debug.log*>> .gitignore
echo lerna-debug.log*>> .gitignore
echo.>> .gitignore
echo node_modules>> .gitignore
echo dist>> .gitignore
echo dist-ssr>> .gitignore
echo *.local>> .gitignore
echo.>> .gitignore
echo # Editor directories and files>> .gitignore
echo .vscode/*>> .gitignore
echo !.vscode/extensions.json>> .gitignore
echo .idea>> .gitignore
echo .DS_Store>> .gitignore
echo *.suo>> .gitignore
echo *.ntvs*>> .gitignore
echo *.njsproj>> .gitignore
echo *.sln>> .gitignore
echo *.sw?>> .gitignore

REM Install dependencies and start development server
echo Installing dependencies...
call npm install

echo Building Docker image...
docker build -t zenith-docker .

echo Starting Docker container...
docker run -p 5173:5173 zenith-docker 