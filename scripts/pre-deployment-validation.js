#!/usr/bin/env node

// scripts/pre-deployment-validation.js
// Pre-deployment validation script that prevents deployment failures

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Since we can't import ES modules directly in this Node.js context,
// we'll create a TypeScript compilation and execution approach
async function runValidation() {
  console.log('🔍 Running deployment validation...\n');
  
  try {
    // First, ensure TypeScript compilation
    console.log('📋 Compiling TypeScript validation agent...');
    await executeCommand('npx tsc --noEmit --skipLibCheck');
    
    // Run the validation using ts-node
    console.log('🔍 Running deployment validation checks...');
    const validationScript = `
const { DeploymentValidatorAgent } = require('../src/lib/agents/deployment-validator-agent.ts');

async function validate() {
  const validator = new DeploymentValidatorAgent(process.cwd());
  const result = await validator.validateForDeployment();
  
  console.log(result.summary);
  
  if (!result.isValid) {
    console.log('\\n🛠️ Attempting auto-fixes...');
    const autoFixResult = await validator.autoFix(result.errors);
    
    if (autoFixResult.fixed > 0) {
      console.log(\`✅ Auto-fixed \${autoFixResult.fixed} issues\`);
    }
    
    if (autoFixResult.remaining.length > 0) {
      console.log('\\n❌ Manual fixes required:');
      autoFixResult.remaining.forEach(error => {
        console.log(\`  • \${error.file}:\${error.line || '?'} - \${error.message}\`);
        console.log(\`    Fix: \${error.fix}\\n\`);
      });
      
      process.exit(1);
    }
  }
  
  if (result.warnings.length > 0) {
    console.log('\\n⚠️ Recommendations:');
    result.warnings.forEach(warning => {
      console.log(\`  • \${warning.file} - \${warning.message}\`);
      console.log(\`    Recommendation: \${warning.recommendation}\\n\`);
    });
  }
  
  console.log('🚀 Validation complete! Ready for deployment.');
}

validate().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});`;

    // Write temporary validation script
    const tempScript = path.join(__dirname, 'temp-validation.js');
    fs.writeFileSync(tempScript, validationScript);
    
    // Execute validation
    await executeCommand(`node "${tempScript}"`);
    
    // Clean up
    fs.unlinkSync(tempScript);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      if (stdout) console.log(stdout);
      if (stderr) console.warn(stderr);
      
      resolve();
    });
  });
}

// Manual validation checks for immediate use
async function runManualChecks() {
  console.log('🔍 Running immediate deployment checks...\n');
  
  const checks = [
    {
      name: 'SSR Compatibility',
      check: checkSSRCompatibility,
      critical: true
    },
    {
      name: 'Missing Components',
      check: checkMissingComponents,
      critical: true
    },
    {
      name: 'Animation Libraries',
      check: checkAnimationLibraries,
      critical: true
    },
    {
      name: 'TypeScript Compilation',
      check: checkTypeScript,
      critical: true
    }
  ];
  
  let hasErrors = false;
  
  for (const check of checks) {
    try {
      console.log(`Checking ${check.name}...`);
      const result = await check.check();
      
      if (result.errors.length > 0) {
        console.log(`❌ ${check.name} failed:`);
        result.errors.forEach(error => {
          console.log(`  • ${error}`);
        });
        
        if (check.critical) {
          hasErrors = true;
        }
      } else {
        console.log(`✅ ${check.name} passed`);
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.log(`⚠️ ${check.name} warnings:`);
        result.warnings.forEach(warning => {
          console.log(`  • ${warning}`);
        });
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ ${check.name} error: ${error.message}\n`);
      if (check.critical) {
        hasErrors = true;
      }
    }
  }
  
  if (hasErrors) {
    console.log('❌ Critical deployment issues found! Please fix before deploying.');
    process.exit(1);
  } else {
    console.log('🚀 All checks passed! Ready for deployment.');
  }
}

async function checkSSRCompatibility() {
  const errors = [];
  const warnings = [];
  
  // Check for framer-motion imports in page components
  const pageFiles = getFilesRecursively('./src/app', /page\.(tsx|ts)$/);
  
  for (const file of pageFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    if (content.includes('framer-motion')) {
      errors.push(`${file}: Framer Motion in page component can cause SSR errors`);
    }
    
    // Check for direct document/window usage
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (containsClientOnlyAPI(line) && !hasSSRGuard(content)) {
        errors.push(`${file}:${index + 1}: Client-side API usage without SSR guard`);
      }
    });
  }
  
  return { errors, warnings };
}

async function checkMissingComponents() {
  const errors = [];
  const warnings = [];
  
  const componentFiles = [
    './src/components/ui/button.tsx',
    './src/components/ui/card.tsx',
    './src/components/ui/badge.tsx',
    './src/components/ui/tabs.tsx',
    './src/components/ui/loading-spinner.tsx'
  ];
  
  for (const file of componentFiles) {
    if (!fs.existsSync(file)) {
      errors.push(`Missing component: ${file}`);
    }
  }
  
  return { errors, warnings };
}

async function checkAnimationLibraries() {
  const errors = [];
  const warnings = [];
  
  // Check for motion components in app directory
  const appFiles = getFilesRecursively('./src/app', /\.(tsx|ts)$/);
  
  for (const file of appFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    if (content.includes('motion.') && !content.includes('"use client"')) {
      errors.push(`${file}: Motion component without "use client" directive`);
    }
  }
  
  return { errors, warnings };
}

async function checkTypeScript() {
  const errors = [];
  const warnings = [];
  
  try {
    await executeCommand('npx tsc --noEmit --skipLibCheck');
  } catch (error) {
    errors.push(`TypeScript compilation failed: ${error.message}`);
  }
  
  return { errors, warnings };
}

function getFilesRecursively(dir, pattern) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && pattern.test(item)) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function containsClientOnlyAPI(line) {
  const clientOnlyAPIs = [
    'document.',
    'window.',
    'localStorage.',
    'sessionStorage.',
    'navigator.',
    'location.',
    'history.'
  ];
  
  return clientOnlyAPIs.some(api => line.includes(api));
}

function hasSSRGuard(content) {
  const safeguards = [
    'typeof window !== "undefined"',
    'typeof document !== "undefined"',
    'useEffect(',
    'useLayoutEffect(',
    '"use client"'
  ];
  
  return safeguards.some(guard => content.includes(guard));
}

// Run manual checks immediately
runManualChecks().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
