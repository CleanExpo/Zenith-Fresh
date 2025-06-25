/**
 * ZENITH ENTERPRISE - BUNDLE OPTIMIZATION ENGINE
 * Advanced bundle analysis and optimization with intelligent code splitting
 */

import { promises as fs } from 'fs';
import path from 'path';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunkSizes: Map<string, number>;
  dependencies: Map<string, string[]>;
  duplicates: Array<{
    module: string;
    occurrences: number;
    totalSize: number;
  }>;
  recommendations: OptimizationRecommendation[];
}

interface OptimizationRecommendation {
  type: 'code-splitting' | 'tree-shaking' | 'dynamic-import' | 'lazy-loading' | 'compression';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
  implementation: string;
}

interface ChunkStrategy {
  name: string;
  pattern: string;
  priority: number;
  cacheGroup: string;
}

export class BundleOptimizer {
  private buildDir: string;
  private analysis: BundleAnalysis | null = null;
  private optimizationStrategies: ChunkStrategy[] = [];

  constructor(buildDir: string = '.next') {
    this.buildDir = buildDir;
    this.initializeStrategies();
  }

  /**
   * Initialize optimization strategies
   */
  private initializeStrategies(): void {
    this.optimizationStrategies = [
      {
        name: 'vendor',
        pattern: 'node_modules',
        priority: 1,
        cacheGroup: 'vendor'
      },
      {
        name: 'common',
        pattern: 'src/lib',
        priority: 2,
        cacheGroup: 'common'
      },
      {
        name: 'components',
        pattern: 'src/components',
        priority: 3,
        cacheGroup: 'components'
      },
      {
        name: 'pages',
        pattern: 'src/app',
        priority: 4,
        cacheGroup: 'pages'
      }
    ];
  }

  /**
   * Analyze current bundle structure
   */
  async analyzeBundles(): Promise<BundleAnalysis> {
    console.log('Starting bundle analysis...');
    
    const bundleFiles = await this.getBundleFiles();
    const chunkSizes = new Map<string, number>();
    const dependencies = new Map<string, string[]>();
    let totalSize = 0;
    let gzippedSize = 0;

    // Analyze each bundle file
    for (const file of bundleFiles) {
      const filePath = path.join(this.buildDir, file);
      const stats = await fs.stat(filePath);
      const size = stats.size;
      
      chunkSizes.set(file, size);
      totalSize += size;
      
      // Calculate gzipped size
      const content = await fs.readFile(filePath);
      const compressed = await gzipAsync(content);
      gzippedSize += compressed.length;
      
      // Analyze dependencies
      const deps = await this.analyzeDependencies(filePath);
      dependencies.set(file, deps);
    }

    // Find duplicates
    const duplicates = await this.findDuplicateModules(dependencies);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(chunkSizes, duplicates);

    this.analysis = {
      totalSize,
      gzippedSize,
      chunkSizes,
      dependencies,
      duplicates,
      recommendations
    };

    return this.analysis;
  }

  /**
   * Get all bundle files
   */
  private async getBundleFiles(): Promise<string[]> {
    const staticDir = path.join(this.buildDir, 'static');
    
    if (!(await this.exists(staticDir))) {
      throw new Error(`Build directory not found: ${staticDir}`);
    }

    const files: string[] = [];
    
    async function walkDir(dir: string, relativePath: string = ''): Promise<void> {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          await walkDir(fullPath, relPath);
        } else if (item.endsWith('.js') || item.endsWith('.css')) {
          files.push(path.join('static', relPath));
        }
      }
    }
    
    await walkDir(staticDir);
    return files;
  }

  /**
   * Analyze dependencies in a bundle file
   */
  private async analyzeDependencies(filePath: string): Promise<string[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const dependencies: string[] = [];
      
      // Simple regex to find imports/requires
      const importRegex = /(?:import|require)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
      
      return [...new Set(dependencies)]; // Remove duplicates
    } catch (error) {
      console.warn(`Failed to analyze dependencies for ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Find duplicate modules across bundles
   */
  private async findDuplicateModules(dependencies: Map<string, string[]>): Promise<Array<{
    module: string;
    occurrences: number;
    totalSize: number;
  }>> {
    const moduleOccurrences = new Map<string, number>();
    
    // Count occurrences of each module
    for (const [chunk, deps] of dependencies.entries()) {
      for (const dep of deps) {
        moduleOccurrences.set(dep, (moduleOccurrences.get(dep) || 0) + 1);
      }
    }
    
    // Find duplicates
    const duplicates = [];
    for (const [module, occurrences] of moduleOccurrences.entries()) {
      if (occurrences > 1) {
        const estimatedSize = await this.estimateModuleSize(module);
        duplicates.push({
          module,
          occurrences,
          totalSize: estimatedSize * occurrences
        });
      }
    }
    
    return duplicates.sort((a, b) => b.totalSize - a.totalSize);
  }

  /**
   * Generate optimization recommendations
   */
  private async generateRecommendations(
    chunkSizes: Map<string, number>,
    duplicates: Array<{ module: string; occurrences: number; totalSize: number }>
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Large chunk analysis
    const largeChunks = Array.from(chunkSizes.entries())
      .filter(([_, size]) => size > 500000) // 500KB threshold
      .sort((a, b) => b[1] - a[1]);
    
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'code-splitting',
        priority: 'high',
        description: `Large chunks detected: ${largeChunks.map(([name, size]) => `${name} (${this.formatSize(size)})`).join(', ')}`,
        estimatedSavings: largeChunks.reduce((sum, [_, size]) => sum + size * 0.3, 0),
        implementation: 'Implement dynamic imports and route-based code splitting'
      });
    }
    
    // Duplicate module analysis
    const significantDuplicates = duplicates.filter(d => d.totalSize > 50000); // 50KB threshold
    
    if (significantDuplicates.length > 0) {
      recommendations.push({
        type: 'tree-shaking',
        priority: 'high',
        description: `Duplicate modules found: ${significantDuplicates.slice(0, 3).map(d => d.module).join(', ')}`,
        estimatedSavings: significantDuplicates.reduce((sum, d) => sum + d.totalSize * 0.8, 0),
        implementation: 'Configure webpack splitChunks to extract common modules'
      });
    }
    
    // Compression recommendations
    const totalUncompressed = Array.from(chunkSizes.values()).reduce((sum, size) => sum + size, 0);
    if (totalUncompressed > 1000000) { // 1MB threshold
      recommendations.push({
        type: 'compression',
        priority: 'medium',
        description: 'Large bundle size detected, enable advanced compression',
        estimatedSavings: totalUncompressed * 0.7,
        implementation: 'Enable Brotli compression and optimize asset delivery'
      });
    }
    
    // Lazy loading recommendations
    const pageChunks = Array.from(chunkSizes.entries())
      .filter(([name]) => name.includes('pages/') || name.includes('app/'))
      .length;
    
    if (pageChunks > 10) {
      recommendations.push({
        type: 'lazy-loading',
        priority: 'medium',
        description: 'Multiple page chunks detected',
        estimatedSavings: 200000, // Estimated savings
        implementation: 'Implement lazy loading for non-critical routes'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return (priorityWeight[b.priority] * 1000 + b.estimatedSavings) - 
             (priorityWeight[a.priority] * 1000 + a.estimatedSavings);
    });
  }

  /**
   * Apply optimization strategies
   */
  async applyOptimizations(): Promise<{
    applied: string[];
    configUpdates: any;
    estimatedImprovement: number;
  }> {
    if (!this.analysis) {
      throw new Error('Bundle analysis must be performed first');
    }
    
    console.log('Applying bundle optimizations...');
    
    const applied: string[] = [];
    const configUpdates: any = {};
    let estimatedImprovement = 0;
    
    // Generate webpack configuration
    const webpackConfig = await this.generateWebpackConfig();
    configUpdates.webpack = webpackConfig;
    applied.push('webpack-config');
    
    // Generate Next.js configuration
    const nextConfig = await this.generateNextConfig();
    configUpdates.nextjs = nextConfig;
    applied.push('nextjs-config');
    
    // Generate dynamic import suggestions
    const dynamicImports = await this.generateDynamicImportSuggestions();
    configUpdates.dynamicImports = dynamicImports;
    applied.push('dynamic-imports');
    
    // Calculate estimated improvement
    estimatedImprovement = this.analysis.recommendations
      .reduce((sum, rec) => sum + rec.estimatedSavings, 0);
    
    return {
      applied,
      configUpdates,
      estimatedImprovement
    };
  }

  /**
   * Generate optimized webpack configuration
   */
  private async generateWebpackConfig(): Promise<any> {
    return {
      optimization: {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            },
            components: {
              test: /[\\/]src[\\/]components[\\/]/,
              name: 'components',
              chunks: 'all',
              priority: 15
            }
          }
        },
        usedExports: true,
        sideEffects: false
      },
      resolve: {
        alias: {
          '@': path.resolve(process.cwd(), 'src')
        }
      }
    };
  }

  /**
   * Generate optimized Next.js configuration
   */
  private async generateNextConfig(): Promise<any> {
    return {
      experimental: {
        optimizeCss: true,
        optimizeImages: true,
        gzipSize: true
      },
      compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
      },
      images: {
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60 * 60 * 24 * 365 // 1 year
      },
      headers: async () => [
        {
          source: '/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            }
          ]
        }
      ]
    };
  }

  /**
   * Generate dynamic import suggestions
   */
  private async generateDynamicImportSuggestions(): Promise<Array<{
    file: string;
    suggestion: string;
    reason: string;
  }>> {
    if (!this.analysis) return [];
    
    const suggestions = [];
    
    // Analyze large components
    for (const [chunk, size] of this.analysis.chunkSizes.entries()) {
      if (size > 100000 && chunk.includes('components/')) { // 100KB threshold
        suggestions.push({
          file: chunk,
          suggestion: `const LazyComponent = dynamic(() => import('./${chunk}'), { loading: () => <Spinner /> });`,
          reason: `Large component (${this.formatSize(size)}) - implement lazy loading`
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Generate bundle optimization report
   */
  async generateReport(): Promise<{
    analysis: BundleAnalysis;
    recommendations: OptimizationRecommendation[];
    implementation: {
      immediate: string[];
      progressive: string[];
      advanced: string[];
    };
  }> {
    if (!this.analysis) {
      this.analysis = await this.analyzeBundles();
    }
    
    const implementation = {
      immediate: [
        'Enable compression for static assets',
        'Configure proper cache headers',
        'Optimize image loading with next/image'
      ],
      progressive: [
        'Implement code splitting for large components',
        'Add dynamic imports for non-critical features',
        'Setup lazy loading for below-the-fold content'
      ],
      advanced: [
        'Implement advanced webpack optimizations',
        'Setup module federation for micro-frontends',
        'Configure advanced tree shaking'
      ]
    };
    
    return {
      analysis: this.analysis,
      recommendations: this.analysis.recommendations,
      implementation
    };
  }

  // Helper methods
  private async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async estimateModuleSize(moduleName: string): Promise<number> {
    // Simple estimation based on module name
    if (moduleName.includes('react')) return 50000;
    if (moduleName.includes('lodash')) return 70000;
    if (moduleName.includes('@')) return 20000;
    return 10000; // Default estimate
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default BundleOptimizer;