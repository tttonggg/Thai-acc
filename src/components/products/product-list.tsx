'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Package, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ProductEditDialog } from './product-edit-dialog';
import { ProductViewDialog } from './product-view-dialog';

interface Product {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  category?: string;
  unit: string;
  type: 'PRODUCT' | 'SERVICE';
  salePrice: number;
  costPrice: number;
  vatRate: number;
  vatType: 'EXCLUSIVE' | 'INCLUSIVE' | 'NONE';
  isInventory: boolean;
  quantity: number;
  minQuantity: number;
  incomeType?: string;
  costingMethod: 'WEIGHTED_AVERAGE' | 'FIFO';
  isActive: boolean;
  notes?: string;
}

const PRODUCT_CATEGORIES = [
  'สินค้าสำเร็จรูป',
  'วัตถุดิบ',
  'สินค้ากึ่งสำเร็จรูป',
  'บริการ',
  'อื่นๆ',
];

const categoryColors: Record<string, string> = {
  สินค้าสำเร็จรูป: 'bg-blue-100 text-blue-800',
  วัตถุดิบ: 'bg-green-100 text-green-800',
  สินค้ากึ่งสำเร็จรูป: 'bg-yellow-100 text-yellow-800',
  บริการ: 'bg-purple-100 text-purple-800',
  อื่นๆ: 'bg-gray-100 text-gray-800',
};

const typeLabels: Record<string, string> = {
  PRODUCT: 'สินค้า',
  SERVICE: 'บริการ',
};

export function ProductList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });

  useEffect(() => {
    fetchProducts();
  }, [refreshKey]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all')
        params.append('isActive', filterStatus === 'active' ? 'true' : 'false');

      const res = await fetch(`/api/products?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Fetch failed');
      const json = await res.json();
      const data = json?.data ?? json ?? [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ข้อผิดพลาดในการโหลดข้อมูล';
      setError(message);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'โหลดข้อมูลสินค้าไม่สำเร็จ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = safeProducts.filter((product) => {
    if (!product) return false;

    // Category filter
    if (filterCategory !== 'all' && product.category !== filterCategory) {
      return false;
    }

    return true;
  });

  // Calculate stock level indicator
  const getStockLevel = (product: Product) => {
    if (!product.isInventory) return null;

    const ratio = product.quantity / (product.minQuantity || 1);
    if (ratio <= 0) return { color: 'bg-red-500', label: 'หมดสต็อก' };
    if (ratio <= 0.5) return { color: 'bg-red-100 text-red-800', label: 'ต่ำวิกฤต' };
    if (ratio <= 1) return { color: 'bg-yellow-100 text-yellow-800', label: 'ต่ำ' };
    return { color: 'bg-green-100 text-green-800', label: 'ปกติ' };
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsAddDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteDialog({
      open: true,
      id: product.id,
      name: `${product.code} - ${product.name}`,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(`/api/products/${deleteDialog.id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'ไม่สามารถลบสินค้าได้');
      }

      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบข้อมูลสินค้าเรียบร้อยแล้ว',
      });
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถลบสินค้าได้';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialog({ open: false, id: '', name: '' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              รายการสินค้าและบริการ ({filteredProducts.length} รายการ)
            </CardTitle>
            <Button onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มสินค้า/บริการ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหารหัส ชื่อสินค้า..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setRefreshKey((prev) => prev + 1);
                    }
                  }}
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">ใช้งาน</SelectItem>
                <SelectItem value="inactive">ระงับ</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setRefreshKey((prev) => prev + 1)} variant="outline">
              รีเฟรช
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="m-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="ยังไม่มีสินค้า"
              description="เริ่มต้นเพิ่มสินค้าหรือบริการของคุณ"
              action={{ label: 'เพิ่มสินค้าใหม่', onClick: () => setIsAddDialogOpen(true) }}
            />
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">รหัส</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead className="w-[120px]">หมวดหมู่</TableHead>
                    <TableHead className="w-[80px]">ประเภท</TableHead>
                    <TableHead className="w-[120px] text-right">ราคาขาย</TableHead>
                    <TableHead className="w-[120px] text-right">ราคาทุน</TableHead>
                    <TableHead className="w-[80px] text-center">VAT</TableHead>
                    <TableHead className="w-[100px] text-center">สต็อก</TableHead>
                    <TableHead className="w-[80px] text-center">สถานะ</TableHead>
                    <TableHead className="w-[140px] text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockLevel = getStockLevel(product);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.code}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.nameEn && (
                              <div className="text-xs text-muted-foreground">{product.nameEn}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge className={categoryColors[product.category] || 'bg-gray-100'}>
                              {product.category}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{typeLabels[product.type]}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(product.salePrice)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(product.costPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{product.vatRate}%</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {product.isInventory ? (
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {product.quantity.toFixed(2)}
                              </div>
                              {stockLevel && (
                                <Badge className={stockLevel.color} variant="secondary">
                                  {stockLevel.label}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={product.isActive ? 'default' : 'secondary'}
                            className={product.isActive ? 'bg-green-100 text-green-800' : ''}
                          >
                            {product.isActive ? 'ใช้งาน' : 'ระงับ'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewProduct(product)}
                              title="ดูรายละเอียด"
                              className="h-11 w-11"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                              title="แก้ไข"
                              className="h-11 w-11"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(product)}
                              title="ลบ"
                              className="h-11 w-11"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <ProductEditDialog
        product={selectedProduct}
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          if (!open) setSelectedProduct(null);
        }}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          setSelectedProduct(null);
        }}
      />

      {/* View Dialog */}
      <ProductViewDialog
        product={selectedProduct}
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) setSelectedProduct(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบสินค้า</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบสินค้า <strong>{deleteDialog.name}</strong> ใช่หรือไม่?
              <br />
              <span className="text-destructive">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
