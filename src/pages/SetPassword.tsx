import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

export default function SetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Handle the auth callback from the invite link
    const handleAuthCallback = async () => {
      try {
        // Check for hash parameters (Supabase uses hash for auth callbacks)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken && type === 'invite') {
          // Set the session from the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            toast({
              variant: 'destructive',
              title: 'خطأ في الرابط',
              description: 'رابط الدعوة غير صالح أو منتهي الصلاحية',
            });
            navigate('/auth');
            return;
          }

          setHasSession(true);
          // Clear the hash to clean up the URL
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          // Check for existing session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setHasSession(true);
          } else {
            toast({
              variant: 'destructive',
              title: 'جلسة غير صالحة',
              description: 'يرجى استخدام رابط الدعوة المرسل إلى بريدك الإلكتروني',
            });
            navigate('/auth');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'حدث خطأ أثناء معالجة الرابط',
        });
        navigate('/auth');
      } finally {
        setIsSessionLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const validation = passwordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      toast({
        variant: 'destructive',
        title: 'خطأ في البيانات',
        description: validation.error.errors[0].message,
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      toast({
        title: 'تم تعيين كلمة المرور',
        description: 'تم تعيين كلمة المرور بنجاح، جاري تحويلك...',
      });

      // Redirect to home page
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        variant: 'destructive',
        title: 'فشل تعيين كلمة المرور',
        description: error.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">جاري التحقق من الرابط...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif">تعيين كلمة المرور</CardTitle>
          <CardDescription>
            مرحباً بك! يرجى تعيين كلمة مرور جديدة لحسابك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="pl-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                <li className={password.length >= 8 ? 'text-green-600' : ''}>
                  • 8 أحرف على الأقل
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                  • حرف كبير واحد على الأقل
                </li>
                <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                  • حرف صغير واحد على الأقل
                </li>
                <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                  • رقم واحد على الأقل
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  className="pl-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  كلمتا المرور متطابقتان
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  جاري الحفظ...
                </>
              ) : (
                'تعيين كلمة المرور'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
