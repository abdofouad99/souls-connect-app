import { Link } from "react-router-dom";
import { Phone, Home, Info, Heart, Users } from "lucide-react";
export function Footer() {
  return <footer className="bg-foreground text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Links - moved to first column */}

          {/* Quick Links */}
          <div>
            <h3 className="font-serif font-bold mb-4 text-xl text-secondary">روابط سريعة</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="flex items-center gap-2 text-base text-primary-foreground/80 hover:text-secondary transition-colors">
                <Home className="h-4 w-4" />
                الرئيسة
              </Link>
              <Link to="/about" className="flex items-center gap-2 text-base text-primary-foreground/80 hover:text-secondary transition-colors">
                <Info className="h-4 w-4" />
                نبذة عن الجمعية
              </Link>
              <Link to="/sponsorship" className="flex items-center gap-2 text-base text-primary-foreground/80 hover:text-secondary transition-colors">
                <Heart className="h-4 w-4" />
                مشروع كفالة الأيتام
              </Link>
              <Link to="/orphans" className="flex items-center gap-2 text-base text-primary-foreground/80 hover:text-secondary transition-colors">
                <Users className="h-4 w-4" />
                لبدء الكفالة في غزة
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            
            <div className="flex flex-col gap-3">
              
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                
                
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                
                
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} رعاية الأيتام. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>;
}