'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Copy, 
  Check, 
  Globe, 
  Lock, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Code,
  FileJson,
  BookOpen,
  ExternalLink
} from 'lucide-react';

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  name: string;
  description: string;
  category: string;
  auth: boolean;
  requestBody?: object;
  queryParams?: { name: string; type: string; required: boolean; description: string }[];
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'auth-login',
    method: 'POST',
    path: '/api/auth/callback/credentials',
    name: 'Login',
    description: 'Authenticate user and get session token',
    category: 'Authentication',
    auth: false,
    requestBody: {
      email: 'admin@thaiaccounting.com',
      password: 'admin123',
      redirect: false
    }
  },
  {
    id: 'accounts-list',
    method: 'GET',
    path: '/api/accounts',
    name: 'List Accounts',
    description: 'Get list of chart of accounts',
    category: 'Accounts',
    auth: true,
    queryParams: [
      { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 20)' },
      { name: 'type', type: 'string', required: false, description: 'Filter by type: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE' },
      { name: 'search', type: 'string', required: false, description: 'Search by name or code' }
    ]
  },
  {
    id: 'accounts-create',
    method: 'POST',
    path: '/api/accounts',
    name: 'Create Account',
    description: 'Create a new account in chart of accounts',
    category: 'Accounts',
    auth: true,
    requestBody: {
      code: '1102',
      name: 'ลูกหนี้การค้า - ลูกค้ารายย่อย',
      type: 'ASSET',
      parentId: 'acc_001'
    }
  },
  {
    id: 'invoices-list',
    method: 'GET',
    path: '/api/invoices',
    name: 'List Invoices',
    description: 'Get list of sales invoices',
    category: 'Invoices',
    auth: true,
    queryParams: [
      { name: 'page', type: 'number', required: false, description: 'Page number' },
      { name: 'limit', type: 'number', required: false, description: 'Items per page' },
      { name: 'status', type: 'string', required: false, description: 'DRAFT, ISSUED, PARTIAL, PAID, CANCELLED' },
      { name: 'customerId', type: 'string', required: false, description: 'Filter by customer ID' },
      { name: 'startDate', type: 'string', required: false, description: 'Filter from date (YYYY-MM-DD)' },
      { name: 'endDate', type: 'string', required: false, description: 'Filter to date (YYYY-MM-DD)' }
    ]
  },
  {
    id: 'invoices-create',
    method: 'POST',
    path: '/api/invoices',
    name: 'Create Invoice',
    description: 'Create a new sales invoice',
    category: 'Invoices',
    auth: true,
    requestBody: {
      customerId: 'cust_001',
      invoiceDate: '2024-03-15',
      dueDate: '2024-04-15',
      lines: [
        {
          description: 'บริการที่ปรึกษา',
          quantity: 1,
          unitPrice: 50000,
          vatRate: 7
        }
      ]
    }
  },
  {
    id: 'invoices-issue',
    method: 'POST',
    path: '/api/invoices/{id}/issue',
    name: 'Issue Invoice',
    description: 'Issue invoice and create journal entries',
    category: 'Invoices',
    auth: true
  },
  {
    id: 'receipts-list',
    method: 'GET',
    path: '/api/receipts',
    name: 'List Receipts',
    description: 'Get list of receipts',
    category: 'Receipts',
    auth: true
  },
  {
    id: 'receipts-create',
    method: 'POST',
    path: '/api/receipts',
    name: 'Create Receipt',
    description: 'Create a new receipt',
    category: 'Receipts',
    auth: true,
    requestBody: {
      customerId: 'cust_001',
      receiptDate: '2024-03-15',
      paymentMethod: 'BANK_TRANSFER',
      amount: 53500,
      allocations: [
        {
          invoiceId: 'inv_001',
          amount: 53500
        }
      ]
    }
  },
  {
    id: 'journal-list',
    method: 'GET',
    path: '/api/journal',
    name: 'List Journal Entries',
    description: 'Get list of journal entries',
    category: 'Journal',
    auth: true
  },
  {
    id: 'journal-create',
    method: 'POST',
    path: '/api/journal',
    name: 'Create Journal Entry',
    description: 'Create a new journal entry',
    category: 'Journal',
    auth: true,
    requestBody: {
      date: '2024-03-15',
      description: 'ปรับปรุงบัญชี',
      reference: 'ADJ-001',
      lines: [
        { accountId: 'acc_001', description: 'โอนเงิน', debit: 10000, credit: 0 },
        { accountId: 'acc_002', description: 'โอนเงิน', debit: 0, credit: 10000 }
      ]
    }
  },
  {
    id: 'customers-list',
    method: 'GET',
    path: '/api/customers',
    name: 'List Customers',
    description: 'Get list of customers',
    category: 'Customers',
    auth: true
  },
  {
    id: 'customers-create',
    method: 'POST',
    path: '/api/customers',
    name: 'Create Customer',
    description: 'Create a new customer',
    category: 'Customers',
    auth: true,
    requestBody: {
      code: 'CUST-001',
      name: 'บริษัท ตัวอย่าง จำกัด',
      taxId: '1234567890123',
      address: '123 ถนนสุขุมวิท',
      phone: '02-123-4567',
      email: 'contact@example.com'
    }
  },
  {
    id: 'reports-gl',
    method: 'GET',
    path: '/api/reports/general-ledger',
    name: 'General Ledger Report',
    description: 'Get general ledger report',
    category: 'Reports',
    auth: true,
    queryParams: [
      { name: 'startDate', type: 'string', required: true, description: 'Start date (YYYY-MM-DD)' },
      { name: 'endDate', type: 'string', required: true, description: 'End date (YYYY-MM-DD)' },
      { name: 'accountId', type: 'string', required: false, description: 'Filter by account ID' }
    ]
  },
  {
    id: 'settings-get',
    method: 'GET',
    path: '/api/settings',
    name: 'Get Settings',
    description: 'Get system settings',
    category: 'Settings',
    auth: true
  },
  {
    id: 'settings-update',
    method: 'PUT',
    path: '/api/settings',
    name: 'Update Settings',
    description: 'Update system settings',
    category: 'Settings',
    auth: true,
    requestBody: {
      companyName: 'บริษัท ตัวอย่าง จำกัด',
      taxId: '1234567890123',
      vatRate: 7,
      address: '123 ถนนสุขุมวิท'
    }
  }
];

const CATEGORIES = Array.from(new Set(ENDPOINTS.map(e => e.category)));

const LANGUAGE_TEMPLATES: Record<string, (endpoint: Endpoint, baseUrl: string, body?: string) => string> = {
  curl: (endpoint, baseUrl, body) => {
    const url = `${baseUrl}${endpoint.path}`;
    let cmd = `curl -X ${endpoint.method} "${url}"`;
    if (endpoint.auth) cmd += ' \\\n  -b cookies.txt';
    if (body) {
      cmd += ' \\\n  -H "Content-Type: application/json" \\\n  -d '\'' + body + '\'';
    }
    return cmd;
  },
  javascript: (endpoint, baseUrl, body) => {
    const url = endpoint.path;
    let code = `// Using Fetch API\n`;
    code += `const response = await fetch('${url}', {\n`;
    code += `  method: '${endpoint.method}',\n`;
    if (body) {
      code += `  headers: { 'Content-Type': 'application/json' },\n`;
      code += `  body: JSON.stringify(${body})\n`;
    }
    code += `});\n\n`;
    code += `const data = await response.json();\n`;
    code += `console.log(data);`;
    return code;
  },
  python: (endpoint, baseUrl, body) => {
    let code = `import requests\n\n`;
    code += `url = '${baseUrl}${endpoint.path}'\n`;
    if (body) {
      code += `data = ${body}\n\n`;
      code += `response = requests.${endpoint.method.toLowerCase()}(url, json=data)\n`;
    } else {
      code += `response = requests.${endpoint.method.toLowerCase()}(url)\n`;
    }
    code += `print(response.json())`;
    return code;
  },
  php: (endpoint, baseUrl, body) => {
    let code = `<?php\n`;
    code += `$ch = curl_init('${baseUrl}${endpoint.path}');\n`;
    code += `curl_setopt($ch, CURLOPT_${endpoint.method}, 1);\n`;
    if (body) {
      code += `curl_setopt($ch, CURLOPT_POSTFIELDS, '${body}');\n`;
      code += `curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);\n`;
    }
    code += `curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n`;
    code += `$response = curl_exec($ch);\n`;
    code += `curl_close($ch);\n\n`;
    code += `echo $response;\n?>`;
    return code;
  },
  java: (endpoint, baseUrl, body) => {
    let code = `// Using OkHttp\n`;
    code += `OkHttpClient client = new OkHttpClient();\n\n`;
    if (body) {
      code += `RequestBody requestBody = RequestBody.create(\n`;
      code += `    MediaType.parse("application/json"),\n`;
      code += `    "${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
      code += `);\n\n`;
    }
    code += `Request request = new Request.Builder()\n`;
    code += `    .url("${baseUrl}${endpoint.path}")\n`;
    code += `    .${endpoint.method.toLowerCase()}(${body ? 'requestBody' : ''})\n`;
    code += `    .build();\n\n`;
    code += `try (Response response = client.newCall(request).execute()) {\n`;
    code += `    System.out.println(response.body().string());\n`;
    code += `}`;
    return code;
  }
};

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState('');
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('try');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (selectedEndpoint.requestBody) {
      setRequestBody(JSON.stringify(selectedEndpoint.requestBody, null, 2));
    } else {
      setRequestBody('');
    }
    setQueryParams({});
    setResponse(null);
    setError(null);
  }, [selectedEndpoint]);

  const handleTryIt = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let url = selectedEndpoint.path;
      
      // Replace path parameters
      Object.entries(queryParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, value);
      });

      // Add query parameters for GET requests
      if (selectedEndpoint.method === 'GET' && selectedEndpoint.queryParams) {
        const searchParams = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value) searchParams.append(key, value);
        });
        const queryString = searchParams.toString();
        if (queryString) url += `?${queryString}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (selectedEndpoint.requestBody && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Request failed');
      }

      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const generateCode = (language: string) => {
    const template = LANGUAGE_TEMPLATES[language];
    return template(selectedEndpoint, baseUrl, requestBody);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Interactive API Documentation</h1>
        <p className="text-muted-foreground">
          Explore and test the Thai Accounting ERP API endpoints. Try requests directly in the browser.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Endpoint List */}
        <div className="lg:col-span-1">
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="px-4 pb-4 space-y-4">
                  {CATEGORIES.map(category => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {ENDPOINTS.filter(e => e.category === category).map(endpoint => (
                          <button
                            key={endpoint.id}
                            onClick={() => setSelectedEndpoint(endpoint)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedEndpoint.id === endpoint.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className={`${getMethodColor(endpoint.method)} text-white text-xs px-1.5 py-0`}
                              >
                                {endpoint.method}
                              </Badge>
                              <span className="truncate">{endpoint.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`${getMethodColor(selectedEndpoint.method)} text-white`}>
                      {selectedEndpoint.method}
                    </Badge>
                    <code className="text-lg font-mono bg-muted px-2 py-1 rounded">
                      {selectedEndpoint.path}
                    </code>
                    {selectedEndpoint.auth && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Auth Required
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{selectedEndpoint.name}</CardTitle>
                  <CardDescription>{selectedEndpoint.description}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="try" className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Try It Now
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Code Examples
                  </TabsTrigger>
                  <TabsTrigger value="docs" className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    Documentation
                  </TabsTrigger>
                </TabsList>

                {/* Try It Now Tab */}
                <TabsContent value="try" className="space-y-4 mt-4">
                  {selectedEndpoint.queryParams && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Query Parameters</h4>
                      {selectedEndpoint.queryParams.map(param => (
                        <div key={param.name} className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{param.name}</code>
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                          <div className="col-span-9">
                            <Input
                              placeholder={param.description}
                              value={queryParams[param.name] || ''}
                              onChange={e => setQueryParams(prev => ({ 
                                ...prev, 
                                [param.name]: e.target.value 
                              }))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedEndpoint.requestBody && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Request Body</h4>
                      <Textarea
                        value={requestBody}
                        onChange={e => setRequestBody(e.target.value)}
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    <span>Base URL: {baseUrl || '...'}</span>
                  </div>

                  <Button 
                    onClick={handleTryIt} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Try It Now
                      </>
                    )}
                  </Button>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-700 mb-2">
                        <XCircle className="w-5 h-5" />
                        <span className="font-semibold">Error</span>
                      </div>
                      <pre className="text-red-600 text-sm">{error}</pre>
                    </div>
                  )}

                  {response && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Success</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <pre className="text-green-800 text-sm overflow-auto max-h-96">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                    </div>
                  )}
                </TabsContent>

                {/* Code Examples Tab */}
                <TabsContent value="code" className="mt-4">
                  <Tabs defaultValue="curl">
                    <TabsList className="mb-4">
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="php">PHP</TabsTrigger>
                      <TabsTrigger value="java">Java</TabsTrigger>
                    </TabsList>

                    {Object.keys(LANGUAGE_TEMPLATES).map(lang => (
                      <TabsContent key={lang} value={lang}>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(generateCode(lang))}
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono">
                            {generateCode(lang)}
                          </pre>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </TabsContent>

                {/* Documentation Tab */}
                <TabsContent value="docs" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Endpoint</h4>
                      <p className="text-muted-foreground">
                        <code className="bg-muted px-2 py-1 rounded">{selectedEndpoint.method} {selectedEndpoint.path}</code>
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-muted-foreground">{selectedEndpoint.description}</p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Authentication</h4>
                      <p className="text-muted-foreground">
                        {selectedEndpoint.auth 
                          ? 'This endpoint requires authentication via session cookie.' 
                          : 'This endpoint does not require authentication.'}
                      </p>
                    </div>

                    {selectedEndpoint.queryParams && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2">Query Parameters</h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Parameter</th>
                                <th className="text-left py-2">Type</th>
                                <th className="text-left py-2">Required</th>
                                <th className="text-left py-2">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedEndpoint.queryParams.map(param => (
                                <tr key={param.name} className="border-b">
                                  <td className="py-2"><code>{param.name}</code></td>
                                  <td className="py-2">{param.type}</td>
                                  <td className="py-2">{param.required ? 'Yes' : 'No'}</td>
                                  <td className="py-2 text-muted-foreground">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {selectedEndpoint.requestBody && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2">Request Body</h4>
                          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                            {JSON.stringify(selectedEndpoint.requestBody, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Response Format</h4>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}`}
                      </pre>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Error Codes</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Code</th>
                            <th className="text-left py-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">400</td>
                            <td className="py-2 text-muted-foreground">Bad Request - Invalid input data</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">401</td>
                            <td className="py-2 text-muted-foreground">Unauthorized - Authentication required</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">403</td>
                            <td className="py-2 text-muted-foreground">Forbidden - Insufficient permissions</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">404</td>
                            <td className="py-2 text-muted-foreground">Not Found - Resource does not exist</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">409</td>
                            <td className="py-2 text-muted-foreground">Conflict - Resource state conflict</td>
                          </tr>
                          <tr>
                            <td className="py-2">500</td>
                            <td className="py-2 text-muted-foreground">Server Error - Internal server error</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Rate Limit Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Rate Limiting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Limit</th>
                    <th className="text-left py-2">Window</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Authentication</td>
                    <td className="py-2">5 requests</td>
                    <td className="py-2">15 minutes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">General API</td>
                    <td className="py-2">60 requests</td>
                    <td className="py-2">1 minute</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Reports</td>
                    <td className="py-2">10 requests</td>
                    <td className="py-2">1 minute</td>
                  </tr>
                  <tr>
                    <td className="py-2">Export</td>
                    <td className="py-2">5 requests</td>
                    <td className="py-2">5 minutes</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
