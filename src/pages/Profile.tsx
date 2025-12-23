import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, Calendar, Heart, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Profile as ProfileType, Sponsorship } from '@/lib/types';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country: '',
    preferred_contact: 'email',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProfileType | null;
    },
    enabled: !!user?.id,
  });

  // Fetch user sponsorships
  const { data: sponsorships, isLoading: sponsorshipsLoading } = useQuery({
    queryKey: ['user-sponsorships', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get the sponsor record for this user
      const { data: sponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!sponsor) return [];

      // Then get all sponsorships for this sponsor
      const { data, error } = await supabase
        .from('sponsorships')
        .select(`
          *,
          orphan:orphans(*)
        `)
        .eq('sponsor_id', sponsor.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Sponsorship & { orphan: any })[];
    },
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<ProfileType>) => {
      if (!user?.id) throw new Error('User not found');
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بياناتك بنجاح',
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث البيانات',
      });
    },
  });

  // Set form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        preferred_contact: profile.preferred_contact || 'email',
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({
      full_name: formData.full_name,
      phone: formData.phone,
      country: formData.country,
      preferred_contact: formData.preferred_contact,
    });
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        preferred_contact: profile.preferred_contact || 'email',
      });
    }
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary text-primary-foreground">نشط</Badge>;
      case 'paused':
        return <Badge variant="secondary">متوقف</Badge>;
      case 'completed':
        return <Badge variant="outline">مكتمل</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center animate-fade-up">
            <h1 className="text-4xl font-bold text-foreground mb-4">الملف الشخصي</h1>
            <p className="text-muted-foreground">
              إدارة بياناتك الشخصية ومتابعة كفالاتك
            </p>
          </div>

          {/* Profile Card */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  البيانات الشخصية
                </CardTitle>
                <CardDescription>معلوماتك الشخصية وبيانات التواصل</CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 ml-2" />
                    إلغاء
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    الاسم الكامل
                  </Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground font-medium py-2">{profile?.full_name || '-'}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    البريد الإلكتروني
                  </Label>
                  <p className="text-foreground font-medium py-2">{user?.email || profile?.email || '-'}</p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    رقم الهاتف
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      dir="ltr"
                    />
                  ) : (
                    <p className="text-foreground font-medium py-2" dir="ltr">
                      {profile?.phone || '-'}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    الدولة
                  </Label>
                  {isEditing ? (
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground font-medium py-2">{profile?.country || '-'}</p>
                  )}
                </div>
              </div>

              {/* Member since */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  عضو منذ: {profile?.created_at ? format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: ar }) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sponsorships Card */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary fill-primary" />
                كفالاتي
              </CardTitle>
              <CardDescription>
                {sponsorships && sponsorships.length > 0
                  ? `لديك ${sponsorships.length} كفالة`
                  : 'لم تقم بأي كفالة بعد'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sponsorshipsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : sponsorships && sponsorships.length > 0 ? (
                <div className="space-y-4">
                  {sponsorships.map((sponsorship) => (
                    <div
                      key={sponsorship.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {/* Orphan Image */}
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {sponsorship.orphan?.photo_url ? (
                          <img
                            src={sponsorship.orphan.photo_url}
                            alt={sponsorship.orphan.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Sponsorship Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">
                          {sponsorship.orphan?.full_name || 'يتيم'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {sponsorship.type === 'monthly' ? 'كفالة شهرية' : 'كفالة سنوية'} • {sponsorship.monthly_amount} ر.س/شهر
                        </p>
                        <p className="text-xs text-muted-foreground">
                          بدأت: {format(new Date(sponsorship.start_date), 'dd MMMM yyyy', { locale: ar })}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0">
                        {getStatusBadge(sponsorship.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">لم تقم بأي كفالة بعد</p>
                  <Button onClick={() => navigate('/orphans')}>
                    اكفل يتيماً الآن
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
