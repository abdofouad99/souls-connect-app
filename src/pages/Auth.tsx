import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectPath = searchParams.get('redirect');

  useEffect(() => {
    if (user) {
      // Redirect to saved path or home
      const destination = redirectPath ? decodeURIComponent(redirectPath) : '/';
      navigate(destination, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({ title: 'تم تسجيل الدخول بنجاح' });
        const destination = redirectPath ? decodeURIComponent(redirectPath) : '/';
        navigate(destination, { replace: true });
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: 'تم إنشاء الحساب بنجاح' });
        const destination = redirectPath ? decodeURIComponent(redirectPath) : '/';
        navigate(destination, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: 'حدث خطأ',
        description: error.message || 'يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-card animate-scale-in">
          <div className="text-center mb-8">
            <Heart className="h-12 w-12 mx-auto text-primary fill-primary/20 mb-4" />
            <h1 className="text-2xl font-serif font-bold text-foreground">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h1>
            {redirectPath && (
              <p className="text-sm text-muted-foreground mt-2">
                الرجاء تسجيل الدخول أولاً لإتمام الكفالة أو استخدام خدمات الموقع
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}

            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? 'جاري التحميل...' : isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button type="button" className="text-sm text-primary hover:underline" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخولك'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
