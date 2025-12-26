import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Home, Info, Heart, Users, FileText } from "lucide-react";
import logo from "@/assets/logo.jpg";

export function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="شعار جمعية الأقصى" className="h-10 w-10 rounded-full object-cover" />
              <span className="text-lg font-serif font-bold">جمعية الأقصى لرعاية الأيتام</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              نسعى لتوفير حياة كريمة للأيتام من خلال برامج الكفالة والدعم المستمر. ساهم معنا في رسم البسمة على وجوههم.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif font-bold mb-4">روابط سريعة</h3>
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-secondary transition-colors"
              >
                <Home className="h-4 w-4" />
                الرئيسية
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-secondary transition-colors"
              >
                <Info className="h-4 w-4" />
                من نحن
              </Link>
              <Link
                to="/sponsorship"
                className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-secondary transition-colors"
              >
                <Heart className="h-4 w-4" />
                كفالة الأيتام
              </Link>
              <Link
                to="/orphans"
                className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-secondary transition-colors"
              >
                <Users className="h-4 w-4" />
                الأيتام
              </Link>
              <Link
                to="/deposit-request"
                className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-secondary transition-colors"
              >
                <FileText className="h-4 w-4" />
                طلب سند إيداع
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif font-bold mb-4">تواصل معنا</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <Phone className="h-4 w-4 text-secondary" />
                <span dir="ltr">77243079 - 04251675 - 784665006</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <Mail className="h-4 w-4 text-secondary" />
                <span> https://www.facebook.com/share/1a6MtvyzUw/ </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <MapPin className="h-4 w-4 text-secondary" />
                <span>
                  {" "}
                  شارع جمال -جولة المسبح -مقابل الكريمي الرئيس-فوق محلات مرح-فوق عيادة د.سميرة الخليدي Taiz, Yemen{" "}
                </span>
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
    </footer>
  );
}
