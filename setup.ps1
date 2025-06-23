# Create project directory
Remove-Item -Path "zenith-docker" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -Path "zenith-docker" -ItemType Directory
Set-Location -Path "zenith-docker"

# Create package.json
@"
{
  "name": "zenith-docker",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8

# Create tsconfig.json
@"
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
"@ | Out-File -FilePath "tsconfig.json" -Encoding UTF8

# Create tsconfig.node.json
@"
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
"@ | Out-File -FilePath "tsconfig.node.json" -Encoding UTF8

# Create vite.config.ts
@"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
"@ | Out-File -FilePath "vite.config.ts" -Encoding UTF8

# Create index.html
@"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zenith Docker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"@ | Out-File -FilePath "index.html" -Encoding UTF8

# Create src directory and files
New-Item -Path "src" -ItemType Directory -ErrorAction SilentlyContinue

# Create src/index.css
@"
@tailwind base;
@tailwind components;
@tailwind utilities;
"@ | Out-File -FilePath "src/index.css" -Encoding UTF8

# Create src/App.tsx
@"
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Zenith Docker</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <p className="text-xl mb-4">Count: {count}</p>
          <button
            onClick={() => setCount(count + 1)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Increment
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
"@ | Out-File -FilePath "src/App.tsx" -Encoding UTF8

# Create src/main.tsx
@"
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
"@ | Out-File -FilePath "src/main.tsx" -Encoding UTF8

# Create tailwind.config.js
@"
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
"@ | Out-File -FilePath "tailwind.config.js" -Encoding UTF8

# Create postcss.config.js
@"
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@ | Out-File -FilePath "postcss.config.js" -Encoding UTF8

# Create Dockerfile
@"
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
"@ | Out-File -FilePath "Dockerfile" -Encoding UTF8

# Create .gitignore
@"
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8

# Install dependencies and start development server
Write-Host "Installing dependencies..."
npm install

Write-Host "Building Docker image..."
docker build -t zenith-docker .

Write-Host "Starting Docker container..."
docker run -p 5173:5173 zenith-docker

docker pull phillmcgurk/zenith-saas-prod:latest
docker stop <container_id>
docker rm <container_id>
docker run -d -p 80:80 phillmcgurk/zenith-saas-prod:latest

docker ps -a
docker images

docker logs <container_id>

ufw status

ufw allow 80
ufw reload

curl localhost

docker rm $(docker ps -aq)

netstat -tuln | grep :80

lsof -i :80

docker ps

docker stop <container_id>
docker rm <container_id>

docker push phillmcgurk/zenith-saas-prod:latest