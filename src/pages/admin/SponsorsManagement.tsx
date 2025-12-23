import { useState } from 'react';
import { Search, Mail, Phone, Download } from 'lucide-react';
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
import { useSponsors, useSponsorships } from '@/hooks/useSponsorships';
import { exportSponsors } from '@/lib/exportUtils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function SponsorsManagement() {
  const { data: sponsors, isLoading: sponsorsLoading } = useSponsors();
  const { data: sponsorships } = useSponsorships();
  const [search, setSearch] = useState('');

  const filteredSponsors = sponsors?.filter(sponsor =>
    sponsor.full_name.includes(search) ||
    sponsor.email.includes(search) ||
    (sponsor.phone && sponsor.phone.includes(search))
  ) || [];

  const getSponsorshipCount = (sponsorId: string) => {
    return sponsorships?.filter(s => s.sponsor_id === sponsorId && s.status === 'active').length || 0;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">إدارة الكفلاء</h1>
            <p className="text-muted-foreground mt-1">عرض بيانات الكفلاء وكفالاتهم</p>
          </div>
          <Button onClick={() => sponsors && exportSponsors(sponsors)} variant="outline" disabled={!sponsors?.length}>
            <Download className="h-5 w-5" />
            تصدير Excel
          </Button>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد أو الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {sponsorsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : filteredSponsors.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              لا يوجد كفلاء حالياً
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>البلد</TableHead>
                    <TableHead>عدد الكفالات النشطة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSponsors.map((sponsor) => (
                    <TableRow key={sponsor.id}>
                      <TableCell className="font-medium">{sponsor.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span dir="ltr">{sponsor.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sponsor.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span dir="ltr">{sponsor.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{sponsor.country || '-'}</TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">
                          {getSponsorshipCount(sponsor.id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(sponsor.created_at), 'dd MMM yyyy', { locale: ar })}
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
