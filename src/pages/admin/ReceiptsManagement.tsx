import { useState } from 'react';
import { Search, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useReceipts } from '@/hooks/useSponsorships';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ReceiptsManagement() {
  const { data: receipts, isLoading } = useReceipts();
  const [search, setSearch] = useState('');

  const filteredReceipts = receipts?.filter(receipt =>
    receipt.receipt_number.includes(search) ||
    receipt.sponsorship?.orphan?.full_name.includes(search) ||
    receipt.sponsorship?.sponsor?.full_name.includes(search)
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">إدارة الإيصالات</h1>
          <p className="text-muted-foreground mt-1">عرض وطباعة إيصالات الكفالة</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الإيصال أو اسم اليتيم أو الكافل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد إيصالات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الإيصال</TableHead>
                    <TableHead>الكافل</TableHead>
                    <TableHead>اليتيم</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>تاريخ الإصدار</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-mono text-sm" dir="ltr">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {receipt.sponsorship?.sponsor?.full_name || '-'}
                      </TableCell>
                      <TableCell>
                        {receipt.sponsorship?.orphan?.full_name || '-'}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {receipt.amount} ر.س
                      </TableCell>
                      <TableCell>
                        {format(new Date(receipt.issue_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/receipt/${receipt.receipt_number}`}>
                            <Printer className="h-4 w-4 ml-1" />
                            طباعة
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
