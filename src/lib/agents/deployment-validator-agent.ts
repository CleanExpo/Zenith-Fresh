// src/lib/agents/deployment-validator-agent.ts
// Deployment Validation Agent - Prevents deployment failures before they happen

import fs from 'fs';
import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: string;
}

export interface ValidationError {
  type: 'SSR_INCOMPATIBLE' | 'MISSING_DEPENDENCY' | 'TYPE_ERROR' | 'ANIMATION_CONFLICT' | 'ROUTE_CONFLICT';
  file: string;
  line?: number;
  message: string;
  fix: string;
}

export interface ValidationWarning {
  type: 'PERFORMANCE' | 'ACCESSIBILITY' | 'BEST_PRACTICE';
  file: string;
  message: string;
  recommendation: string;
}

export class DeploymentValidatorAgent {
  private projectRoot: string;
  private appDirectory: string;
  private componentsDirectory: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.appDirectory = path.join(projectRoot, 'src/app');
    this.componentsDirectory = path.join(projectRoot, 'src/components');
  }

  /**
   * Comprehensive deployment validation
   */
  async validateForDeployment(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. SSR Compatibility Check
    const ssrErrors = await this.validateSSRCompatibility();
    errors.push(...ssrErrors);

    // 2. Component Dependencies Check
    const depErrors = await this.validateComponentDependencies();
    errors.push(...depErrors);

    // 3. TypeScript Validation
    const typeErrors = await this.validateTypeScript();
    errors.push(...typeErrors);

    // 4. Animation Library Conflicts
    const animationErrors = await this.validateAnimationLibraries();
    errors.push(...animationErrors);

    // 5. Route Conflicts
    const routeErrors = await this.validateRouteStructure();
    errors.push(...routeErrors);

    // 6. Performance Warnings
    const perfWarnings = await this.validatePerformance();
    warnings.push(...perfWarnings);

    const isValid = errors.length === 0;
    const summary = this.generateSummary(errors, warnings);

    return {
      isValid,
      errors,
      warnings,
      summary
    };
  }

  /**
   * Validate SSR Compatibility - Prevent document/window errors
   */
  private async validateSSRCompatibility(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const pageFiles = await this.getFilesByPattern(this.appDirectory, /\.(tsx|ts)$/);

    for (const file of pageFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for direct document/window usage without browser checks
        if (this.containsClientOnlyAPI(line) && !this.hasSSRSafeGuard(content, line)) {
          errors.push({
            type: 'SSR_INCOMPATIBLE',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message: `Client-side API usage detected: ${line.trim()}`,
            fix: 'Wrap in typeof window !== "undefined" || use useEffect hook'
          });
        }

        // Check for framer-motion usage
        if (line.includes('from "framer-motion"') || line.includes("from 'framer-motion'")) {
          errors.push({
            type: 'ANIMATION_CONFLICT',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message: 'Framer Motion can cause SSR createContext errors',
            fix: 'Use CSS transitions or implement dynamic imports with ssr: false'
          });
        }
      });
    }

    return errors;
  }

  /**
   * Validate Component Dependencies
   */
  private async validateComponentDependencies(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const componentFiles = await this.getFilesByPattern(this.componentsDirectory, /\.(tsx|ts)$/);
    const appFiles = await this.getFilesByPattern(this.appDirectory, /\.(tsx|ts)$/);
    
    const allFiles = [...componentFiles, ...appFiles];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const imports = this.extractImports(content);

      for (const importPath of imports) {
        if (importPath.startsWith('@/components/ui/')) {
          const componentName = importPath.split('/').pop();
          const componentFile = path.join(this.componentsDirectory, 'ui', `${componentName}.tsx`);
          
          if (!fs.existsSync(componentFile)) {
            errors.push({
              type: 'MISSING_DEPENDENCY',
              file: path.relative(this.projectRoot, file),
              message: `Missing component: ${componentName}`,
              fix: `Create ${componentFile} or install with shadcn CLI`
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Basic TypeScript validation
   */
  private async validateTypeScript(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const tsFiles = await this.getFilesByPattern(this.projectRoot, /\.(tsx|ts)$/);

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for common TypeScript issues
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Check for variant prop issues in Button components
        if (line.includes('<Button') && line.includes('variant=') && !this.isValidButtonVariant(line)) {
          errors.push({
            type: 'TYPE_ERROR',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message: 'Invalid Button variant prop',
            fix: 'Use valid variants: default, destructive, outline, secondary, ghost, link'
          });
        }

        // Check for missing React imports in JSX files
        if (file.endsWith('.tsx') && this.containsJSX(content) && !content.includes('import React')) {
          errors.push({
            type: 'TYPE_ERROR',
            file: path.relative(this.projectRoot, file),
            line: 1,
            message: 'Missing React import in JSX file',
            fix: "Add: import React from 'react';"
          });
        }
      });
    }

    return errors;
  }

  /**
   * Validate Animation Libraries
   */
  private async validateAnimationLibraries(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // Check for motion components without proper SSR handling
    const files = await this.getFilesByPattern(this.appDirectory, /\.(tsx|ts)$/);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (content.includes('motion.')) {
        // Check if it's a page component (could cause SSR issues)
        if (file.includes('/page.tsx') || file.includes('/layout.tsx')) {
          errors.push({
            type: 'ANIMATION_CONFLICT',
            file: path.relative(this.projectRoot, file),
            message: 'Motion components in page/layout can cause SSR errors',
            fix: 'Use dynamic imports with ssr: false or replace with CSS animations'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate Route Structure
   */
  private async validateRouteStructure(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // Check for duplicate routes
    const pageFiles = await this.getFilesByPattern(this.appDirectory, /page\.(tsx|ts)$/);
    const routes = new Set<string>();
    
    for (const file of pageFiles) {
      const route = this.getRouteFromFile(file);
      if (routes.has(route)) {
        errors.push({
          type: 'ROUTE_CONFLICT',
          file: path.relative(this.projectRoot, file),
          message: `Duplicate route: ${route}`,
          fix: 'Remove duplicate route or move to different path'
        });
      }
      routes.add(route);
    }

    return errors;
  }

  /**
   * Performance validation
   */
  private async validatePerformance(): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];
    
    // Check for large bundle imports
    const files = await this.getFilesByPattern(this.projectRoot, /\.(tsx|ts)$/);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for full lodash imports
      if (content.includes('import _ from "lodash"') || content.includes("import _ from 'lodash'")) {
        warnings.push({
          type: 'PERFORMANCE',
          file: path.relative(this.projectRoot, file),
          message: 'Full lodash import detected',
          recommendation: 'Use specific imports: import { debounce } from "lodash"'
        });
      }

      // Check for large icon imports
      if (content.includes('import * as Icons from "lucide-react"')) {
        warnings.push({
          type: 'PERFORMANCE',
          file: path.relative(this.projectRoot, file),
          message: 'Full icon library import detected',
          recommendation: 'Import specific icons: import { User, Mail } from "lucide-react"'
        });
      }
    }

    return warnings;
  }

  // Utility methods
  private async getFilesByPattern(dir: string, pattern: RegExp): Promise<string[]> {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const walk = (currentDir: string) => {
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
    };
    
    walk(dir);
    return files;
  }

  private containsClientOnlyAPI(line: string): boolean {
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

  private hasSSRSafeGuard(content: string, line: string): boolean {
    // Check if there's a safety check in the same function/component
    const safeguards = [
      'typeof window !== "undefined"',
      'typeof document !== "undefined"',
      'useEffect(',
      'useLayoutEffect(',
      '"use client"'
    ];
    
    return safeguards.some(guard => content.includes(guard));
  }

  private extractImports(content: string): string[] {
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private isValidButtonVariant(line: string): boolean {
    const validVariants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];
    const variantMatch = line.match(/variant=["']([^"']+)["']/);
    
    if (!variantMatch) return true; // No variant prop found
    
    return validVariants.includes(variantMatch[1]);
  }

  private containsJSX(content: string): boolean {
    return /<[A-Z][^>]*>/.test(content) || /<[a-z][^>]*>/.test(content);
  }

  private getRouteFromFile(filePath: string): string {
    const relativePath = path.relative(this.appDirectory, filePath);
    const route = relativePath
      .replace('/page.tsx', '')
      .replace('/page.ts', '')
      .replace(/^\((.*?)\)/, '') // Remove route groups
      .replace(/\[([^\]]+)\]/g, ':$1'); // Convert dynamic routes
    
    return '/' + route;
  }

  private generateSummary(errors: ValidationError[], warnings: ValidationWarning[]): string {
    if (errors.length === 0 && warnings.length === 0) {
      return '✅ All validations passed! Ready for deployment.';
    }
    
    let summary = '';
    
    if (errors.length > 0) {
      summary += `❌ ${errors.length} critical errors found:\n`;
      errors.forEach(error => {
        summary += `  • ${error.type}: ${error.message} (${error.file})\n`;
      });
    }
    
    if (warnings.length > 0) {
      summary += `⚠️ ${warnings.length} warnings found:\n`;
      warnings.forEach(warning => {
        summary += `  • ${warning.type}: ${warning.message} (${warning.file})\n`;
      });
    }
    
    return summary;
  }

  /**
   * Auto-fix common issues
   */
  async autoFix(errors: ValidationError[]): Promise<{ fixed: number; remaining: ValidationError[] }> {
    let fixed = 0;
    const remaining: ValidationError[] = [];

    for (const error of errors) {
      const filePath = path.join(this.projectRoot, error.file);
      
      try {
        switch (error.type) {
          case 'MISSING_DEPENDENCY':
            // Auto-create missing components
            if (await this.createMissingComponent(error)) {
              fixed++;
            } else {
              remaining.push(error);
            }
            break;
            
          case 'SSR_INCOMPATIBLE':
            // Auto-wrap with SSR guards
            if (await this.addSSRGuards(filePath, error)) {
              fixed++;
            } else {
              remaining.push(error);
            }
            break;
            
          default:
            remaining.push(error);
        }
      } catch (err) {
        remaining.push(error);
      }
    }

    return { fixed, remaining };
  }

  private async createMissingComponent(error: ValidationError): Promise<boolean> {
    // Implementation for auto-creating missing UI components
    // This would integrate with shadcn CLI or create basic component templates
    return false; // Placeholder - would need implementation
  }

  private async addSSRGuards(filePath: string, error: ValidationError): Promise<boolean> {
    // Implementation for auto-adding SSR safety guards
    // This would analyze the code and add appropriate guards
    return false; // Placeholder - would need implementation
  }
}

export default DeploymentValidatorAgent;
