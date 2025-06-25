/**
 * API Documentation Portal Component
 * Interactive API documentation and testing interface
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Code,
  Play,
  Copy,
  Download,
  ExternalLink,
  Key,
  Shield,
  Zap,
  Database,
  Globe,
  Settings,
  Search,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { APIEndpoint, APIParameter, APIResponse } from '@/types/integrations';

// Mock API endpoints
const mockEndpoints: APIEndpoint[] = [
  {
    id: '1',
    path: '/api/v1/users',
    method: 'GET',
    description: 'Retrieve a list of users with optional filtering and pagination',
    parameters: [
      { name: 'page', type: 'number', required: false, description: 'Page number for pagination', example: 1 },
      { name: 'limit', type: 'number', required: false, description: 'Number of items per page', example: 20 },
      { name: 'search', type: 'string', required: false, description: 'Search term to filter users', example: 'john' }
    ],
    responses: [
      {
        statusCode: 200,
        description: 'Successful response with user list',
        schema: { type: 'object' },
        example: { users: [], total: 0, page: 1, limit: 20 }
      },
      {
        statusCode: 400,
        description: 'Bad request - invalid parameters',
        schema: { type: 'object' },
        example: { error: 'Invalid page parameter' }
      }
    ],
    authentication: ['Bearer Token'],
    rateLimit: { requests: 1000, window: '1h' },
    deprecated: false
  },
  {
    id: '2',
    path: '/api/v1/users',
    method: 'POST',
    description: 'Create a new user account',
    parameters: [
      { name: 'email', type: 'string', required: true, description: 'User email address', example: 'user@example.com' },
      { name: 'name', type: 'string', required: true, description: 'Full name', example: 'John Doe' },
      { name: 'role', type: 'string', required: false, description: 'User role', example: 'user' }
    ],
    responses: [
      {
        statusCode: 201,
        description: 'User created successfully',
        schema: { type: 'object' },
        example: { id: '123', email: 'user@example.com', name: 'John Doe', role: 'user' }
      },
      {
        statusCode: 422,
        description: 'Validation error',
        schema: { type: 'object' },
        example: { error: 'Email already exists' }
      }
    ],
    authentication: ['Bearer Token'],
    rateLimit: { requests: 100, window: '1h' },
    deprecated: false
  }
];

const methodColors = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  PATCH: 'bg-purple-100 text-purple-800'
};

export default function APIDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [testRequest, setTestRequest] = useState({
    parameters: {} as Record<string, any>,
    body: '',
    headers: 'Authorization: Bearer YOUR_TOKEN'
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['authentication']));

  const filteredEndpoints = mockEndpoints.filter(endpoint => 
    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedEndpoints = filteredEndpoints.reduce((acc, endpoint) => {
    const resource = endpoint.path.split('/')[3] || 'general';
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(endpoint);
    return acc;
  }, {} as Record<string, APIEndpoint[]>);

  const handleTestRequest = async () => {
    // Simulate API call
    setTestResponse({
      status: 200,
      data: selectedEndpoint?.responses.find(r => r.statusCode === 200)?.example,
      headers: { 'Content-Type': 'application/json' },
      timing: '234ms'
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Documentation</h2>
          <p className="text-gray-600">Interactive API reference and testing playground</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download SDK
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Postman Collection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Explorer Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                API Explorer
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search endpoints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {/* Authentication Section */}
                <div className="border-b">
                  <button
                    onClick={() => toggleSection('authentication')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Authentication</span>
                    </div>
                    {expandedSections.has('authentication') ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </button>
                  {expandedSections.has('authentication') && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Zenith API uses Bearer token authentication. Include your API token in the Authorization header.
                      </p>
                      <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                        Authorization: Bearer YOUR_API_TOKEN
                      </div>
                    </div>
                  )}
                </div>

                {/* Endpoints by Resource */}
                {Object.entries(groupedEndpoints).map(([resource, endpoints]) => (
                  <div key={resource} className="border-b">
                    <button
                      onClick={() => toggleSection(resource)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-500" />
                        <span className="font-medium capitalize">{resource}</span>
                        <Badge variant="outline" className="text-xs">{endpoints.length}</Badge>
                      </div>
                      {expandedSections.has(resource) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </button>
                    {expandedSections.has(resource) && (
                      <div className="pb-2">
                        {endpoints.map((endpoint) => (
                          <button
                            key={endpoint.id}
                            onClick={() => setSelectedEndpoint(endpoint)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 ${
                              selectedEndpoint?.id === endpoint.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                            }`}
                          >
                            <Badge className={`${methodColors[endpoint.method]} text-xs font-mono`}>
                              {endpoint.method}
                            </Badge>
                            <span className="text-sm font-mono">{endpoint.path}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {selectedEndpoint ? (
            <Tabs defaultValue="documentation" className="space-y-4">
              <TabsList>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="testing">API Testing</TabsTrigger>
                <TabsTrigger value="examples">Code Examples</TabsTrigger>
              </TabsList>

              <TabsContent value="documentation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Badge className={`${methodColors[selectedEndpoint.method]} font-mono`}>
                        {selectedEndpoint.method}
                      </Badge>
                      <code className="text-lg font-mono">{selectedEndpoint.path}</code>
                      {selectedEndpoint.deprecated && (
                        <Badge variant="outline" className="text-orange-600">Deprecated</Badge>
                      )}
                    </div>
                    <CardDescription>{selectedEndpoint.description}</CardDescription>
                  </CardHeader>
                </Card>

                {/* Parameters */}
                {selectedEndpoint.parameters.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Parameters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedEndpoint.parameters.map((param) => (
                          <div key={param.name} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {param.name}
                              </code>
                              <Badge variant="outline" className="text-xs">{param.type}</Badge>
                              {param.required && (
                                <Badge className="bg-red-100 text-red-800 text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{param.description}</p>
                            {param.example && (
                              <div className="text-sm">
                                <span className="text-gray-500">Example: </span>
                                <code className="bg-gray-100 px-2 py-1 rounded">
                                  {JSON.stringify(param.example)}
                                </code>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Responses */}
                <Card>
                  <CardHeader>
                    <CardTitle>Responses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedEndpoint.responses.map((response) => (
                        <div key={response.statusCode} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={
                              response.statusCode < 300 ? 'bg-green-100 text-green-800' :
                              response.statusCode < 400 ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {response.statusCode}
                            </Badge>
                            <span className="font-medium">{response.description}</span>
                          </div>
                          {response.example && (
                            <div>
                              <Label className="text-sm font-medium">Example Response:</Label>
                              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                                {JSON.stringify(response.example, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Authentication & Rate Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Authentication
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedEndpoint.authentication.map((auth) => (
                          <Badge key={auth} variant="outline">{auth}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedEndpoint.rateLimit && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Rate Limits
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          {selectedEndpoint.rateLimit.requests} requests per {selectedEndpoint.rateLimit.window}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="testing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>API Testing Playground</CardTitle>
                    <CardDescription>Test the API endpoint with real requests</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Request Configuration */}
                    <div className="space-y-4">
                      <div>
                        <Label>Headers</Label>
                        <Textarea
                          value={testRequest.headers}
                          onChange={(e) => setTestRequest(prev => ({ ...prev, headers: e.target.value }))}
                          className="mt-2 font-mono text-sm"
                          rows={3}
                        />
                      </div>

                      {selectedEndpoint.parameters.length > 0 && (
                        <div>
                          <Label>Parameters</Label>
                          <div className="mt-2 space-y-2">
                            {selectedEndpoint.parameters.map((param) => (
                              <div key={param.name} className="flex items-center gap-2">
                                <Label className="w-24 text-sm">{param.name}</Label>
                                <Input
                                  placeholder={param.example?.toString() || `Enter ${param.name}`}
                                  onChange={(e) => setTestRequest(prev => ({
                                    ...prev,
                                    parameters: { ...prev.parameters, [param.name]: e.target.value }
                                  }))}
                                  className="flex-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedEndpoint.method !== 'GET' && (
                        <div>
                          <Label>Request Body</Label>
                          <Textarea
                            placeholder="Enter JSON request body"
                            value={testRequest.body}
                            onChange={(e) => setTestRequest(prev => ({ ...prev, body: e.target.value }))}
                            className="mt-2 font-mono text-sm"
                            rows={6}
                          />
                        </div>
                      )}

                      <Button onClick={handleTestRequest} className="w-full flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Send Request
                      </Button>
                    </div>

                    {/* Response */}
                    {testResponse && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label>Response</Label>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              {testResponse.status}
                            </Badge>
                            <span className="text-sm text-gray-600">{testResponse.timing}</span>
                          </div>
                        </div>
                        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                          {JSON.stringify(testResponse.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>cURL</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
{`curl -X ${selectedEndpoint.method} \\
  '${selectedEndpoint.path}' \\
  -H 'Authorization: Bearer YOUR_API_TOKEN' \\
  -H 'Content-Type: application/json'${selectedEndpoint.method !== 'GET' ? ` \\
  -d '${JSON.stringify(selectedEndpoint.responses[0]?.example || {}, null, 2)}'` : ''}`}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => navigator.clipboard.writeText('curl command')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>JavaScript</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
{`const response = await fetch('${selectedEndpoint.path}', {
  method: '${selectedEndpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json'
  }${selectedEndpoint.method !== 'GET' ? `,
  body: JSON.stringify(${JSON.stringify(selectedEndpoint.responses[0]?.example || {}, null, 2)})` : ''}
});

const data = await response.json();
console.log(data);`}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => navigator.clipboard.writeText('javascript code')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Python</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
{`import requests

headers = {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json'
}

${selectedEndpoint.method !== 'GET' ? `data = ${JSON.stringify(selectedEndpoint.responses[0]?.example || {}, null, 2)}

` : ''}response = requests.${selectedEndpoint.method.toLowerCase()}(
    '${selectedEndpoint.path}',
    headers=headers${selectedEndpoint.method !== 'GET' ? ',\n    json=data' : ''}
)

print(response.json())`}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => navigator.clipboard.writeText('python code')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select an API Endpoint</h3>
                <p className="text-sm">Choose an endpoint from the sidebar to view its documentation</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}