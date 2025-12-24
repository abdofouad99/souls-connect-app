import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import logo from '@/assets/logo.jpg';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { href: '/', label: 'الرئيسية' },
    { href: '/sponsorship', label: 'الكفالة' },
    { href: '/orphans', label: 'الأيتام' },
    { href: '/deposit-request', label: 'طلب سند إيداع' },
    { href: '/about', label: 'من نحن' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="شعار جمعية الأقصى" className="h-10 w-10 rounded-full object-cover" />
          <span className="text-xl font-serif font-bold text-foreground">
            جمعية الأقصى
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          
          {(isAdmin || isStaff) && (
            <Link
              to="/admin"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              لوحة التحكم
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span>حسابي</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/profile">الملف الشخصي</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-receipts">إيصالاتي</Link>
                </DropdownMenuItem>
                {(isAdmin || isStaff) && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">لوحة التحكم</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
          )}
          
          <Button asChild variant="hero" size="sm">
            <Link to="/orphans">أكفل يتيماً</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="تبديل القائمة"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary py-2"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {(isAdmin || isStaff) && (
              <Link
                to="/admin"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary py-2"
                onClick={() => setIsOpen(false)}
              >
                لوحة التحكم
              </Link>
            )}
            
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {user ? (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <User className="h-4 w-4 ml-2" />
                      الملف الشخصي
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut} className="w-full">
                    <LogOut className="h-4 w-4 ml-2" />
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    تسجيل الدخول
                  </Link>
                </Button>
              )}
              
              <Button asChild variant="hero" className="w-full">
                <Link to="/orphans" onClick={() => setIsOpen(false)}>
                  أكفل يتيماً
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
