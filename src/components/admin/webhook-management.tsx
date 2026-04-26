'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Edit2, 
  Play, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebhookSubscription {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  retryCount: number;
  deliveryCount: number;
  createdAt: string;
  updatedAt: string;
}

const WEBHOOK_EVENTS = [
  { value: 'INVOICE_CREATED', label: 'Invoice Created', category: 'Invoices' },
  { value: 'INVOICE_UPDATED', label: 'Invoice Updated', category: 'Invoices' },
  { value: 'INVOICE_ISSUED', label: 'Invoice Issued', category: 'Invoices' },
  { value: 'INVOICE_PAID', label: 'Invoice Paid', category: 'Invoices' },
  { value: 'INVOICE_VOIDED', label: 'Invoice Voided', category: 'Invoices' },
  { value: 'RECEIPT_CREATED', label: 'Receipt Created', category: 'Receipts' },
  { value: 'RECEIPT_POSTED', label: 'Receipt Posted', category: 'Receipts' },
  { value: 'PAYMENT_CREATED', label: 'Payment Created', category: 'Payments' },
  { value: 'PAYMENT_POSTED', label: 'Payment Posted', category: 'Payments' },
  { value: 'JOURNAL_ENTRY_POSTED', label: 'Journal Entry Posted', category: 'Journal' },
  { value: 'CUSTOMER_CREATED', label: 'Customer Created', category: 'Customers' },
  { value: 'CUSTOMER_UPDATED', label: 'Customer Updated', category: 'Customers' },
  { value: 'PRODUCT_CREATED', label: 'Product Created', category: 'Products' },
  { value: 'PRODUCT_UPDATED', label: 'Product Updated', category: 'Products' },
  { value: 'STOCK_MOVEMENT', label: 'Stock Movement', category: 'Inventory' },
];

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookSubscription | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; statusCode?: number; duration?: number; error?: string } | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    isActive: true,
    secret: '',
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch(`/api/admin/webhooks`, { credentials: 'include' });
      const result = await response.json();
      if (result.success) {
        setWebhooks(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch webhooks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`/api/admin/webhooks`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Webhook created successfully',
        });
        setDialogOpen(false);
        fetchWebhooks();
        resetForm();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingWebhook) return;

    try {
      const response = await fetch(`/api/admin/webhooks/${editingWebhook.id}`, { credentials: 'include', 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Webhook updated successfully',
        });
        setDialogOpen(false);
        setEditingWebhook(null);
        fetchWebhooks();
        resetForm();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/admin/webhooks/${id}`, { credentials: 'include', 
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Webhook deleted successfully',
        });
        fetchWebhooks();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async (id: string) => {
    setTestingWebhookId(id);
    setTestResult(null);

    try {
      const response = await fetch(`/api/admin/webhooks/${id}/test`, { credentials: 'include', 
        method: 'POST',
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        statusCode: result.data?.statusCode,
        duration: result.data?.duration,
        error: result.data?.error,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Webhook test successful (${result.data.duration}ms)`,
        });
      } else {
        toast({
          title: 'Failed',
          description: result.data?.error || 'Webhook test failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive',
      });
    } finally {
      setTestingWebhookId(null);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingWebhook(null);
    setDialogOpen(true);
  };

  const openEditDialog = (webhook: WebhookSubscription) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      secret: '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      isActive: true,
      secret: '',
    });
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const groupEventsByCategory = () => {
    const groups: Record<string, typeof WEBHOOK_EVENTS> = {};
    WEBHOOK_EVENTS.forEach(event => {
      if (!groups[event.category]) {
        groups[event.category] = [];
      }
      groups[event.category].push(event);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Subscriptions</h2>
          <p className="text-gray-500">Manage webhook endpoints for real-time event notifications</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <div className="grid gap-4">
        {webhooks.map(webhook => (
          <Card key={webhook.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{webhook.name}</h3>
                    <Badge variant={webhook.isActive ? 'success' : 'secondary'}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <ExternalLink className="w-4 h-4" />
                    {webhook.url}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {webhook.events.slice(0, 5).map(event => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                    {webhook.events.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{webhook.events.length - 5} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {webhook.deliveryCount} deliveries
                    </span>
                    <span>
                      Created {new Date(webhook.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTest(webhook.id)}
                    disabled={testingWebhookId === webhook.id}
                  >
                    {testingWebhookId === webhook.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(webhook)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(webhook.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {testResult && testingWebhookId === null && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span>
                    {testResult.success
                      ? `Test successful (${testResult.statusCode}) in ${testResult.duration}ms`
                      : `Test failed: ${testResult.error}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {webhooks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No webhooks configured</h3>
              <p className="text-gray-500 mb-4">Add a webhook to receive real-time event notifications</p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
            </DialogTitle>
            <DialogDescription>
              Configure webhook endpoint and events to subscribe to
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Webhook Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., CRM Integration"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://your-app.com/webhooks/thai-erp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Secret Key (optional)</Label>
              <Input
                id="secret"
                type="password"
                value={formData.secret}
                onChange={e => setFormData({ ...formData, secret: e.target.value })}
                placeholder="Leave empty to auto-generate"
              />
              <p className="text-xs text-gray-500">
                Used to sign webhook payloads for verification
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={checked => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="space-y-3">
              <Label>Events</Label>
              <ScrollArea className="h-[300px] border rounded-lg p-4">
                <div className="space-y-4">
                  {Object.entries(groupEventsByCategory()).map(([category, events]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">{category}</h4>
                      <div className="space-y-2">
                        {events.map(event => (
                          <div key={event.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={event.value}
                              checked={formData.events.includes(event.value)}
                              onCheckedChange={() => toggleEvent(event.value)}
                            />
                            <label
                              htmlFor={event.value}
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              {event.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingWebhook ? handleUpdate : handleCreate}
              disabled={!formData.name || !formData.url || formData.events.length === 0}
            >
              {editingWebhook ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
