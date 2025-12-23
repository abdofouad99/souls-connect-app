import { useState } from 'react';
import { Search, ExternalLink, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useSponsorships, useUpdateSponsorshipStatus } from '@/hooks/useSponsorships';
import { exportSponsorships } from '@/lib/exportUtils';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusLabels = {
  active: { label: 'نشطة', class: 'bg-primary text-primary-foreground' },
  paused: { label: 'متوقفة', class: 'bg-secondary text-secondary-foreground' },
  completed: { label: 'مكتملة', class: 'bg-accent text-accent-foreground' },
  cancelled: { label: 'ملغاة', class: 'bg-muted text-muted-foreground' },
};

const typeLabels = {
  monthly: 'شهرية',
  yearly: 'سنوية',
};

export default function SponsorshipsManagement() {
  const { data: sponsorships, isLoading } = useSponsorships();
  const updateStatus = useUpdateSponsorshipStatus();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSponsorships = sponsorships?.filter(sponsorship => {
    const matchesSearch = 
      sponsorship.orphan?.full_name.includes(search) ||
      sponsorship.sponsor?.full_name.includes(search) ||
      sponsorship.receipt_number.includes(search);
    
    const matchesStatus = statusFilter === 'all' || sponsorship.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast({ title: 'تم تحديث حالة الكفالة' });
    } catch (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">إدارة الكفالات</h1>
            <p className="text-muted-foreground mt-1">عرض وإدارة جميع الكفالات</p>
          </div>
          <Button onClick={() => sponsorships && exportSponsorships(sponsorships)} variant="outline" disabled={!sponsorships?.length}>
            <Download className="h-5 w-5" />
            تصدير Excel
          </Button>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="بحث باسم اليتيم أو الكافل أو رقم الإيصال..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="paused">متوقفة</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : filteredSponsorships.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد كفالات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الإيصال</TableHead>
                    <TableHead>اليتيم</TableHead>
                    <TableHead>الكافل</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>تاريخ البدء</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSponsorships.map((sponsorship) => (
                    <TableRow key={sponsorship.id}>
                      <TableCell className="font-mono text-sm" dir="ltr">
                        {sponsorship.receipt_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sponsorship.orphan?.full_name || '-'}
                      </TableCell>
                      <TableCell>{sponsorship.sponsor?.full_name || '-'}</TableCell>
                      <TableCell>{typeLabels[sponsorship.type]}</TableCell>
                      <TableCell>{sponsorship.monthly_amount} ر.س</TableCell>
                      <TableCell>
                        {format(new Date(sponsorship.start_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={sponsorship.status}
                          onValueChange={(v) => handleStatusChange(sponsorship.id, v)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <Badge className={statusLabels[sponsorship.status].class}>
                              {statusLabels[sponsorship.status].label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">نشطة</SelectItem>
                            <SelectItem value="paused">متوقفة</SelectItem>
                            <SelectItem value="completed">مكتملة</SelectItem>
                            <SelectItem value="cancelled">ملغاة</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/receipt/${sponsorship.receipt_number}`}>
                            <ExternalLink className="h-4 w-4 ml-1" />
                            الإيصال
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
