/**
 * Enterprise SDK Generator
 * Automatically generates SDKs for multiple programming languages
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    example?: any;
  }>;
  requestBody?: {
    type: string;
    description: string;
    schema: Record<string, any>;
  };
  responses: Array<{
    statusCode: number;
    description: string;
    schema?: Record<string, any>;
  }>;
  authentication: 'none' | 'api_key' | 'oauth' | 'jwt';
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
}

export interface SDKConfig {
  name: string;
  version: string;
  description: string;
  baseUrl: string;
  apiVersion: string;
  authentication: {
    type: 'api_key' | 'oauth' | 'jwt';
    headerName?: string;
    apiKeyPrefix?: string;
  };
  endpoints: APIEndpoint[];
  models: Record<string, any>;
}

class SDKGenerator {
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = config;
  }

  /**
   * Generate TypeScript SDK
   */
  async generateTypeScriptSDK(): Promise<string> {
    const types = this.generateTypeScriptTypes();
    const client = this.generateTypeScriptClient();
    const methods = this.generateTypeScriptMethods();

    return `
// Zenith Platform TypeScript SDK v${this.config.version}
// Auto-generated on ${new Date().toISOString()}

${types}

${client}

${methods}

export default ZenithClient;
`;
  }

  /**
   * Generate Python SDK
   */
  async generatePythonSDK(): Promise<string> {
    const imports = this.generatePythonImports();
    const models = this.generatePythonModels();
    const client = this.generatePythonClient();
    const methods = this.generatePythonMethods();

    return `
"""
Zenith Platform Python SDK v${this.config.version}
Auto-generated on ${new Date().toISOString()}
"""

${imports}

${models}

${client}

${methods}
`;
  }

  /**
   * Generate JavaScript SDK
   */
  async generateJavaScriptSDK(): Promise<string> {
    const client = this.generateJavaScriptClient();
    const methods = this.generateJavaScriptMethods();

    return `
/**
 * Zenith Platform JavaScript SDK v${this.config.version}
 * Auto-generated on ${new Date().toISOString()}
 */

${client}

${methods}

module.exports = ZenithClient;
`;
  }

  /**
   * Generate Go SDK
   */
  async generateGoSDK(): Promise<string> {
    const packageDeclaration = `package zenith`;
    const imports = this.generateGoImports();
    const types = this.generateGoTypes();
    const client = this.generateGoClient();
    const methods = this.generateGoMethods();

    return `
// Zenith Platform Go SDK v${this.config.version}
// Auto-generated on ${new Date().toISOString()}

${packageDeclaration}

${imports}

${types}

${client}

${methods}
`;
  }

  /**
   * Generate C# SDK
   */
  async generateCSharpSDK(): Promise<string> {
    const usings = this.generateCSharpUsings();
    const namespace = this.generateCSharpNamespace();
    const models = this.generateCSharpModels();
    const client = this.generateCSharpClient();
    const methods = this.generateCSharpMethods();

    return `
// Zenith Platform C# SDK v${this.config.version}
// Auto-generated on ${new Date().toISOString()}

${usings}

${namespace}
{
${models}

${client}

${methods}
}
`;
  }

  /**
   * Generate OpenAPI Specification
   */
  async generateOpenAPISpec(): Promise<string> {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: this.config.name,
        description: this.config.description,
        version: this.config.version,
        contact: {
          name: 'Zenith Platform API Support',
          url: 'https://zenith.dev/support',
          email: 'api-support@zenith.dev'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [{
        url: this.config.baseUrl,
        description: 'Production server'
      }],
      paths: this.generateOpenAPIPaths(),
      components: {
        schemas: this.generateOpenAPISchemas(),
        securitySchemes: this.generateOpenAPISecuritySchemes()
      },
      security: this.generateOpenAPISecurity()
    };

    return JSON.stringify(spec, null, 2);
  }

  /**
   * Private helper methods for TypeScript generation
   */
  private generateTypeScriptTypes(): string {
    let types = `
// Type definitions
export interface ZenithClientConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ZenithResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  success: boolean;
}

export interface ZenithError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}
`;

    // Generate model interfaces
    for (const [modelName, schema] of Object.entries(this.config.models)) {
      types += `
export interface ${modelName} {
${this.generateTypeScriptInterface(schema)}
}
`;
    }

    return types;
  }

  private generateTypeScriptInterface(schema: any): string {
    let properties = '';
    for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
      const optional = schema.required?.includes(propName) ? '' : '?';
      const type = this.mapToTypeScriptType(propSchema as any);
      properties += `  ${propName}${optional}: ${type};\n`;
    }
    return properties;
  }

  private mapToTypeScriptType(schema: any): string {
    switch (schema.type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'array': return `${this.mapToTypeScriptType(schema.items)}[]`;
      case 'object': return 'Record<string, any>';
      default: return 'any';
    }
  }

  private generateTypeScriptClient(): string {
    return `
export class ZenithClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: ZenithClientConfig) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || '${this.config.baseUrl}';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  private async makeRequest<T>(
    method: string,
    path: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<ZenithResponse<T>> {
    const url = new URL(path, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ZenithSDK-TypeScript/${this.config.version}'
    };

    if (this.apiKey) {
      headers['Authorization'] = \`Bearer \${this.apiKey}\`;
    }

    let attempt = 0;
    while (attempt <= this.retries) {
      try {
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          signal: AbortSignal.timeout(this.timeout)
        });

        const responseData = await response.json();

        return {
          data: responseData,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          success: response.ok
        };
      } catch (error) {
        if (attempt === this.retries) {
          throw new Error(\`Request failed after \${this.retries} retries: \${error.message}\`);
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Request failed');
  }
`;
  }

  private generateTypeScriptMethods(): string {
    let methods = '';

    for (const endpoint of this.config.endpoints) {
      const methodName = this.generateMethodName(endpoint);
      const parameters = this.generateTypeScriptMethodParameters(endpoint);
      const returnType = this.generateTypeScriptReturnType(endpoint);
      const methodBody = this.generateTypeScriptMethodBody(endpoint);

      methods += `
  /**
   * ${endpoint.description}
   */
  async ${methodName}(${parameters}): Promise<${returnType}> {
${methodBody}
  }
`;
    }

    methods += '\n}'; // Close the class

    return methods;
  }

  private generateMethodName(endpoint: APIEndpoint): string {
    const pathParts = endpoint.path.split('/').filter(part => part && !part.startsWith('{'));
    const method = endpoint.method.toLowerCase();
    
    if (method === 'get' && pathParts.length > 0) {
      return `get${this.toPascalCase(pathParts[pathParts.length - 1])}`;
    } else if (method === 'post') {
      return `create${this.toPascalCase(pathParts[pathParts.length - 1] || 'resource')}`;
    } else if (method === 'put' || method === 'patch') {
      return `update${this.toPascalCase(pathParts[pathParts.length - 1] || 'resource')}`;
    } else if (method === 'delete') {
      return `delete${this.toPascalCase(pathParts[pathParts.length - 1] || 'resource')}`;
    }
    
    return `${method}${this.toPascalCase(pathParts.join('_'))}`;
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, char) => char.toUpperCase());
  }

  private generateTypeScriptMethodParameters(endpoint: APIEndpoint): string {
    const params = [];
    
    // Path parameters
    const pathParams = endpoint.parameters.filter(p => p.name.includes('path'));
    pathParams.forEach(param => {
      params.push(`${param.name}: ${this.mapToTypeScriptType({ type: param.type })}`);
    });

    // Query parameters
    const queryParams = endpoint.parameters.filter(p => !p.name.includes('path'));
    if (queryParams.length > 0) {
      params.push(`params?: { ${queryParams.map(p => 
        `${p.name}${p.required ? '' : '?'}: ${this.mapToTypeScriptType({ type: p.type })}`
      ).join('; ')} }`);
    }

    // Request body
    if (endpoint.requestBody) {
      params.push(`data: ${endpoint.requestBody.type}`);
    }

    return params.join(', ');
  }

  private generateTypeScriptReturnType(endpoint: APIEndpoint): string {
    const successResponse = endpoint.responses.find(r => r.statusCode >= 200 && r.statusCode < 300);
    if (successResponse?.schema) {
      return `ZenithResponse<${successResponse.schema.type || 'any'}>`;
    }
    return 'ZenithResponse';
  }

  private generateTypeScriptMethodBody(endpoint: APIEndpoint): string {
    let path = endpoint.path;
    
    // Replace path parameters
    const pathParams = endpoint.parameters.filter(p => p.name.includes('path'));
    pathParams.forEach(param => {
      path = path.replace(`{${param.name}}`, `\${${param.name}}`);
    });

    const hasQueryParams = endpoint.parameters.some(p => !p.name.includes('path'));
    const hasRequestBody = !!endpoint.requestBody;

    return `    return this.makeRequest('${endpoint.method}', \`${path}\`${hasRequestBody ? ', data' : ', undefined'}${hasQueryParams ? ', params' : ''});`;
  }

  /**
   * Python generation methods
   */
  private generatePythonImports(): string {
    return `
import json
import time
import requests
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass
from enum import Enum
`;
  }

  private generatePythonModels(): string {
    let models = '';
    
    for (const [modelName, schema] of Object.entries(this.config.models)) {
      models += `
@dataclass
class ${modelName}:
${this.generatePythonDataclass(schema)}
`;
    }

    return models;
  }

  private generatePythonDataclass(schema: any): string {
    let fields = '';
    for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
      const type = this.mapToPythonType(propSchema as any);
      const optional = schema.required?.includes(propName) ? '' : 'Optional[';
      const closing = optional ? ']' : '';
      fields += `    ${propName}: ${optional}${type}${closing}\n`;
    }
    return fields || '    pass';
  }

  private mapToPythonType(schema: any): string {
    switch (schema.type) {
      case 'string': return 'str';
      case 'number': return 'float';
      case 'integer': return 'int';
      case 'boolean': return 'bool';
      case 'array': return `List[${this.mapToPythonType(schema.items)}]`;
      case 'object': return 'Dict[str, Any]';
      default: return 'Any';
    }
  }

  private generatePythonClient(): string {
    return `
class ZenithClient:
    def __init__(self, api_key: str = None, base_url: str = "${this.config.baseUrl}", timeout: int = 30, retries: int = 3):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.retries = retries
        self.session = requests.Session()
        
        if self.api_key:
            self.session.headers.update({'Authorization': f'Bearer {self.api_key}'})
        
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': f'ZenithSDK-Python/${this.config.version}'
        })

    def _make_request(self, method: str, path: str, data: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        
        for attempt in range(self.retries + 1):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    timeout=self.timeout
                )
                
                response.raise_for_status()
                return response.json()
                
            except requests.RequestException as e:
                if attempt == self.retries:
                    raise Exception(f"Request failed after {self.retries} retries: {str(e)}")
                time.sleep(2 ** attempt)
        
        raise Exception("Request failed")
`;
  }

  private generatePythonMethods(): string {
    let methods = '';

    for (const endpoint of this.config.endpoints) {
      const methodName = this.generatePythonMethodName(endpoint);
      const parameters = this.generatePythonMethodParameters(endpoint);
      const methodBody = this.generatePythonMethodBody(endpoint);

      methods += `
    def ${methodName}(${parameters}) -> Dict[str, Any]:
        """${endpoint.description}"""
${methodBody}
`;
    }

    return methods;
  }

  private generatePythonMethodName(endpoint: APIEndpoint): string {
    const pathParts = endpoint.path.split('/').filter(part => part && !part.startsWith('{'));
    const method = endpoint.method.toLowerCase();
    
    if (method === 'get' && pathParts.length > 0) {
      return `get_${this.toSnakeCase(pathParts[pathParts.length - 1])}`;
    } else if (method === 'post') {
      return `create_${this.toSnakeCase(pathParts[pathParts.length - 1] || 'resource')}`;
    } else if (method === 'put' || method === 'patch') {
      return `update_${this.toSnakeCase(pathParts[pathParts.length - 1] || 'resource')}`;
    } else if (method === 'delete') {
      return `delete_${this.toSnakeCase(pathParts[pathParts.length - 1] || 'resource')}`;
    }
    
    return `${method}_${this.toSnakeCase(pathParts.join('_'))}`;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  private generatePythonMethodParameters(endpoint: APIEndpoint): string {
    const params = ['self'];
    
    // Path parameters
    const pathParams = endpoint.parameters.filter(p => p.name.includes('path'));
    pathParams.forEach(param => {
      params.push(`${param.name}: ${this.mapToPythonType({ type: param.type })}`);
    });

    // Query parameters
    const queryParams = endpoint.parameters.filter(p => !p.name.includes('path'));
    if (queryParams.length > 0) {
      params.push(`params: Optional[Dict[str, Any]] = None`);
    }

    // Request body
    if (endpoint.requestBody) {
      params.push(`data: ${endpoint.requestBody.type}`);
    }

    return params.join(', ');
  }

  private generatePythonMethodBody(endpoint: APIEndpoint): string {
    let path = endpoint.path;
    
    // Replace path parameters
    const pathParams = endpoint.parameters.filter(p => p.name.includes('path'));
    pathParams.forEach(param => {
      path = path.replace(`{${param.name}}`, `{${param.name}}`);
    });

    const hasQueryParams = endpoint.parameters.some(p => !p.name.includes('path'));
    const hasRequestBody = !!endpoint.requestBody;

    return `        return self._make_request('${endpoint.method}', f"${path}"${hasRequestBody ? ', data' : ', None'}${hasQueryParams ? ', params' : ''})`;
  }

  // Similar methods for JavaScript, Go, and C# would be implemented here...
  private generateJavaScriptClient(): string { return '// JavaScript client implementation'; }
  private generateJavaScriptMethods(): string { return '// JavaScript methods implementation'; }
  private generateGoImports(): string { return '// Go imports'; }
  private generateGoTypes(): string { return '// Go types'; }
  private generateGoClient(): string { return '// Go client implementation'; }
  private generateGoMethods(): string { return '// Go methods implementation'; }
  private generateCSharpUsings(): string { return '// C# usings'; }
  private generateCSharpNamespace(): string { return 'namespace ZenithSDK'; }
  private generateCSharpModels(): string { return '// C# models'; }
  private generateCSharpClient(): string { return '// C# client implementation'; }
  private generateCSharpMethods(): string { return '// C# methods implementation'; }

  // OpenAPI generation methods
  private generateOpenAPIPaths(): Record<string, any> {
    const paths: Record<string, any> = {};
    
    for (const endpoint of this.config.endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }
      
      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        description: endpoint.description,
        parameters: endpoint.parameters.map(param => ({
          name: param.name,
          in: param.name.includes('path') ? 'path' : 'query',
          required: param.required,
          description: param.description,
          schema: { type: param.type },
          example: param.example
        })),
        requestBody: endpoint.requestBody ? {
          required: true,
          content: {
            'application/json': {
              schema: endpoint.requestBody.schema
            }
          }
        } : undefined,
        responses: endpoint.responses.reduce((acc, response) => {
          acc[response.statusCode] = {
            description: response.description,
            content: response.schema ? {
              'application/json': {
                schema: response.schema
              }
            } : undefined
          };
          return acc;
        }, {} as Record<string, any>),
        security: endpoint.authentication !== 'none' ? [{ [endpoint.authentication]: [] }] : undefined
      };
    }
    
    return paths;
  }

  private generateOpenAPISchemas(): Record<string, any> {
    return this.config.models;
  }

  private generateOpenAPISecuritySchemes(): Record<string, any> {
    const schemes: Record<string, any> = {};
    
    if (this.config.authentication.type === 'api_key') {
      schemes.api_key = {
        type: 'apiKey',
        in: 'header',
        name: this.config.authentication.headerName || 'Authorization'
      };
    }
    
    return schemes;
  }

  private generateOpenAPISecurity(): Array<Record<string, string[]>> {
    return [{ [this.config.authentication.type]: [] }];
  }
}

// Export the generator
export { SDKGenerator };