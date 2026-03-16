'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  X,
  FileText,
  Video,
  BookOpen,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  MessageCircle,
  Mail,
  Phone,
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  titleEn: string;
  content: string;
  category: string;
  tags: string[];
  type: 'article' | 'video' | 'tutorial';
  url?: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'เริ่มต้นใช้งานระบบ',
    titleEn: 'Getting Started',
    content: 'เรียนรู้พื้นฐานการใช้งาน Thai Accounting ERP ตั้งแต่การเข้าสู่ระบบ การตั้งค่าบริษัท ไปจนถึงการสร้างเอกสารแรกของคุณ',
    category: 'general',
    tags: ['เริ่มต้น', 'login', 'ตั้งค่า', 'พื้นฐาน'],
    type: 'tutorial',
    url: '/docs/tutorials/01-Getting-Started.md'
  },
  {
    id: 'create-invoice',
    title: 'สร้างใบกำกับภาษีขาย',
    titleEn: 'Create Sales Invoice',
    content: 'วิธีสร้างใบกำกับภาษีขาย การเพิ่มลูกค้าและสินค้า การคำนวณ VAT และการออกใบกำกับภาษี',
    category: 'invoices',
    tags: ['ใบกำกับภาษี', 'invoice', 'VAT', 'ขาย', 'ลูกค้า'],
    type: 'tutorial',
    url: '/docs/tutorials/02-Creating-Your-First-Invoice.md'
  },
  {
    id: 'receipt-management',
    title: 'การรับชำระเงิน',
    titleEn: 'Managing Receipts',
    content: 'บันทึกการรับเงินจากลูกค้า การจัดสรรกับใบกำกับภาษี การหักภาษี ณ ที่จ่าย และการรับชำระหลายใบ',
    category: 'receipts',
    tags: ['ใบเสร็จ', 'receipt', 'ชำระเงิน', 'ลูกหนี้', 'WHT'],
    type: 'tutorial',
    url: '/docs/tutorials/03-Managing-Receipts.md'
  },
  {
    id: 'journal-entries',
    title: 'การบันทึกรายการบัญชี',
    titleEn: 'Journal Entries',
    content: 'เรียนรู้หลักการบัญชี Double Entry การบันทึกรายการประจำวัน รายการปรับปรุง และการยกเลิกรายการ',
    category: 'accounting',
    tags: ['สมุดรายวัน', 'journal', 'บัญชี', 'เดบิต', 'เครดิต'],
    type: 'tutorial',
    url: '/docs/tutorials/04-Journal-Entries.md'
  },
  {
    id: 'financial-reports',
    title: 'รายงานทางการเงิน',
    titleEn: 'Financial Reports',
    content: 'การอ่านและวิเคราะห์รายงานทางการเงิน งบดุล งบกำไรขาดทุน งบกระแสเงินสด และรายงานภาษี',
    category: 'reports',
    tags: ['รายงาน', 'reports', 'งบดุล', 'งบกำไร', 'ภาษี'],
    type: 'tutorial',
    url: '/docs/tutorials/05-Financial-Reports.md'
  },
  {
    id: 'inventory-management',
    title: 'การจัดการสินค้าคงคลัง',
    titleEn: 'Inventory Management',
    content: 'การรับสินค้า จ่ายสินค้า การปรับปรุงสต็อก และการคำนวณต้นทุนสินค้า',
    category: 'inventory',
    tags: ['สินค้า', 'inventory', 'สต็อก', 'ต้นทุน', 'FIFO'],
    type: 'tutorial',
    url: '/docs/tutorials/06-Inventory-Management.md'
  },
  {
    id: 'payroll',
    title: 'การจัดการเงินเดือน',
    titleEn: 'Payroll Management',
    content: 'การประมวลผลเงินเดือน คำนวณประกันสังคม ภาษีเงินได้ และการออกสลิปเงินเดือน',
    category: 'payroll',
    tags: ['เงินเดือน', 'payroll', 'ประกันสังคม', 'ภาษี', 'PND1'],
    type: 'tutorial',
    url: '/docs/tutorials/07-Payroll.md'
  },
  {
    id: 'system-settings',
    title: 'การตั้งค่าระบบ',
    titleEn: 'System Settings',
    content: 'การตั้งค่าข้อมูลบริษัท การจัดการผู้ใช้งาน การกำหนดรูปแบบเลขที่เอกสาร และการตั้งค่าอื่นๆ',
    category: 'settings',
    tags: ['ตั้งค่า', 'settings', 'ผู้ใช้', 'เลขที่เอกสาร', 'บริษัท'],
    type: 'tutorial',
    url: '/docs/tutorials/08-Settings-and-Configuration.md'
  },
  {
    id: 'backup-restore',
    title: 'การสำรองและกู้คืนข้อมูล',
    titleEn: 'Backup and Restore',
    content: 'การสำรองข้อมูลด้วยตนเองและอัตโนมัติ การกู้คืนข้อมูล และการส่งออกข้อมูล',
    category: 'settings',
    tags: ['สำรองข้อมูล', 'backup', 'กู้คืน', 'restore', 'ส่งออก'],
    type: 'tutorial',
    url: '/docs/tutorials/09-Backup-and-Restore.md'
  },
  {
    id: 'troubleshooting',
    title: 'การแก้ไขปัญหาที่พบบ่อย',
    titleEn: 'Troubleshooting',
    content: 'แก้ไขปัญหาที่พบบ่อยในการใช้งาน ปัญหาเข้าสู่ระบบ การบันทึกเอกสาร และปัญหาด้านเทคนิค',
    category: 'support',
    tags: ['แก้ไขปัญหา', 'troubleshooting', 'error', 'ข้อผิดพลาด', 'help'],
    type: 'tutorial',
    url: '/docs/tutorials/10-Troubleshooting.md'
  },
  {
    id: 'login-issues',
    title: 'ไม่สามารถเข้าสู่ระบบได้',
    titleEn: 'Cannot Login',
    content: 'หากไม่สามารถเข้าสู่ระบบได้ ให้ตรวจสอบอีเมลและรหัสผ่าน ลองรีเซ็ตรหัสผ่าน หรือติดต่อผู้ดูแลระบบ',
    category: 'support',
    tags: ['login', 'เข้าสู่ระบบ', 'ลืมรหัสผ่าน', 'password', 'error'],
    type: 'article'
  },
  {
    id: 'vat-calculation',
    title: 'การคำนวณ VAT',
    titleEn: 'VAT Calculation',
    content: 'ระบบคำนวณ VAT 7% โดยอัตโนมัติ สามารถเลือกได้ว่าจะให้ราคารวม VAT หรือไม่รวม VAT',
    category: 'invoices',
    tags: ['VAT', 'ภาษีมูลค่าเพิ่ม', '7%', 'คำนวณ', 'ราคา'],
    type: 'article'
  },
  {
    id: 'wht-setup',
    title: 'การตั้งค่าภาษีหัก ณ ที่จ่าย',
    titleEn: 'Withholding Tax Setup',
    content: 'การหักภาษี ณ ที่จ่าย PND3 และ PND53 อัตราภาษีแต่ละประเภท และการออกใบหัก ณ ที่จ่าย',
    category: 'tax',
    tags: ['WHT', 'ภาษีหัก ณ ที่จ่าย', 'PND3', 'PND53', 'หักภาษี'],
    type: 'article'
  },
  {
    id: 'chart-of-accounts',
    title: 'ผังบัญชีมาตรฐาน',
    titleEn: 'Chart of Accounts',
    content: 'ผังบัญชีมาตรฐานไทย 181 บัญชี การสร้างบัญชีใหม่ และโครงสร้างบัญชี 4 หลัก',
    category: 'accounting',
    tags: ['ผังบัญชี', 'chart of accounts', 'บัญชี', 'COA', 'รหัสบัญชี'],
    type: 'article'
  },
  {
    id: 'user-roles',
    title: 'บทบาทและสิทธิ์ผู้ใช้งาน',
    titleEn: 'User Roles and Permissions',
    content: 'การกำหนดสิทธิ์ผู้ใช้งาน ADMIN, ACCOUNTANT, USER, VIEWER และการจัดการผู้ใช้',
    category: 'settings',
    tags: ['ผู้ใช้', 'user', 'สิทธิ์', 'permissions', 'role', 'บทบาท'],
    type: 'article'
  },
  {
    id: 'inventory-costing',
    title: 'วิธีคิดต้นทุนสินค้า',
    titleEn: 'Inventory Costing Methods',
    content: 'การคำนวณต้นทุนสินค้าด้วยวิธี FIFO และ Weighted Average ข้อดีข้อเสียของแต่ละวิธี',
    category: 'inventory',
    tags: ['ต้นทุน', 'costing', 'FIFO', 'weighted average', 'ค่าเฉลี่ย'],
    type: 'article'
  },
  {
    id: 'balance-sheet',
    title: 'การอ่านงบดุล',
    titleEn: 'Understanding Balance Sheet',
    content: 'งบดุลแสดงสภาพการเงินของบริษัท ณ วันใดวันหนึ่ง ประกอบด้วยสินทรัพย์ หนี้สิน และทุน',
    category: 'reports',
    tags: ['งบดุล', 'balance sheet', 'สินทรัพย์', 'หนี้สิน', 'ทุน'],
    type: 'article'
  },
  {
    id: 'income-statement',
    title: 'การอ่านงบกำไรขาดทุน',
    titleEn: 'Understanding Income Statement',
    content: 'งบกำไรขาดทุนแสดงผลการดำเนินงานในช่วงเวลาหนึ่ง รายได้ ค่าใช้จ่าย และกำไรสุทธิ',
    category: 'reports',
    tags: ['งบกำไร', 'income statement', 'รายได้', 'ค่าใช้จ่าย', 'กำไร'],
    type: 'article'
  },
  {
    id: 'api-docs',
    title: 'เอกสาร API',
    titleEn: 'API Documentation',
    content: 'เอกสารประกอบการใช้งาน API สำหรับนักพัฒนา รวมถึงตัวอย่างโค้ดในหลายภาษา',
    category: 'developer',
    tags: ['API', 'developer', 'เอกสาร', 'documentation', 'integration'],
    type: 'article',
    url: '/api/docs'
  },
  {
    id: 'faq',
    title: 'คำถามที่พบบ่อย',
    titleEn: 'Frequently Asked Questions',
    content: 'รวมคำถามที่ผู้ใช้งานถามบ่อย พร้อมคำตอบอย่างละเอียด',
    category: 'support',
    tags: ['FAQ', 'คำถาม', 'help', 'ถามตอบ', 'ปัญหา'],
    type: 'article',
    url: '/FAQ.md'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'ทั้งหมด', nameEn: 'All' },
  { id: 'general', name: 'ทั่วไป', nameEn: 'General' },
  { id: 'invoices', name: 'ใบกำกับภาษี', nameEn: 'Invoices' },
  { id: 'receipts', name: 'การรับเงิน', nameEn: 'Receipts' },
  { id: 'accounting', name: 'บัญชี', nameEn: 'Accounting' },
  { id: 'inventory', name: 'สินค้า', nameEn: 'Inventory' },
  { id: 'payroll', name: 'เงินเดือน', nameEn: 'Payroll' },
  { id: 'reports', name: 'รายงาน', nameEn: 'Reports' },
  { id: 'tax', name: 'ภาษี', nameEn: 'Tax' },
  { id: 'settings', name: 'ตั้งค่า', nameEn: 'Settings' },
  { id: 'support', name: 'ช่วยเหลือ', nameEn: 'Support' },
];

interface HelpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpCenter({ open, onOpenChange }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = useMemo(() => {
    let articles = HELP_ARTICLES;

    if (selectedCategory !== 'all') {
      articles = articles.filter(a => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.titleEn.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query) ||
        a.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return articles;
  }, [searchQuery, selectedCategory]);

  const handleArticleClick = (article: HelpArticle) => {
    if (article.url) {
      window.open(article.url, '_blank');
    } else {
      setSelectedArticle(article);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'tutorial':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'วิดีโอ';
      case 'tutorial':
        return 'บทเรียน';
      default:
        return 'บทความ';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <HelpCircle className="w-6 h-6 text-primary" />
            ศูนย์ช่วยเหลือ
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาคำถามหรือหัวข้อที่ต้องการ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-6 py-3 border-b">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedArticle ? (
                <motion.div
                  key="article"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  {/* Article Header */}
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      กลับไปรายการ
                    </button>
                    <Badge variant="secondary">
                      {getTypeIcon(selectedArticle.type)}
                      <span className="ml-1">{getTypeLabel(selectedArticle.type)}</span>
                    </Badge>
                  </div>

                  {/* Article Content */}
                  <ScrollArea className="flex-1 p-6">
                    <h2 className="text-2xl font-bold mb-2">{selectedArticle.title}</h2>
                    <p className="text-muted-foreground mb-4">{selectedArticle.titleEn}</p>
                    <p className="text-lg leading-relaxed">{selectedArticle.content}</p>
                    
                    {selectedArticle.url && (
                      <a
                        href={selectedArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-6 text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        ดูรายละเอียดเพิ่มเติม
                      </a>
                    )}
                  </ScrollArea>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <ScrollArea className="h-full p-6">
                    {filteredArticles.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">ไม่พบผลลัพธ์</p>
                        <p className="text-muted-foreground">ลองค้นด้วยคำค้นอื่น</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredArticles.map((article) => (
                          <button
                            key={article.id}
                            onClick={() => handleArticleClick(article)}
                            className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getTypeIcon(article.type)}
                                  <h3 className="font-semibold">{article.title}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {article.content}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {article.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs px-2 py-0.5 bg-muted rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>ต้องการความช่วยเหลือเพิ่มเติม?</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="mailto:support@thaiaccounting.com"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">อีเมล</span>
                </a>
                <a
                  href="tel:021234567"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">โทร</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for using help center
export function useHelpCenter() {
  const [open, setOpen] = useState(false);

  return {
    open,
    setOpen,
    HelpCenterComponent: () => (
      <HelpCenter open={open} onOpenChange={setOpen} />
    )
  };
}

// Quick Help Button Component
export function HelpButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
        <span>ช่วยเหลือ</span>
      </button>
      <HelpCenter open={open} onOpenChange={setOpen} />
    </>
  );
}
