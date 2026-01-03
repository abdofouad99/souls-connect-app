import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import heroImage from "@/assets/hero-image.jpg";
import { cn } from "@/lib/utils";

const Index = () => {
  const heroAnim = useScrollAnimation<HTMLElement>();
  const missionAnim = useScrollAnimation<HTMLElement>();

  const contactNumbers = ["77243079", "04251675", "784665006"];

  return (
    <Layout>
      {/* Hero Section */}
      <section ref={heroAnim.ref} className="py-12 md:py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            {/* العنوان الرئيسي */}
            <h1
              className={cn(
                "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-8 transition-all duration-700",
                heroAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              )}
            >
              جمعية الأقصى _ المكتب النسوي _ تعز
            </h1>

            {/* الصورة الرئيسية */}
            <div
              className={cn(
                "mb-10 transition-all duration-700 delay-100",
                heroAnim.isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95",
              )}
            >
              <img
                src={heroImage}
                alt="مشروع كفالة الأيتام - جمعية الأقصى"
                className="w-full max-w-3xl mx-auto rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
              />
            </div>

            {/* قسم أرقام التواصل */}
            <div
              className={cn(
                "bg-card rounded-2xl p-6 md:p-8 shadow-card max-w-md mx-auto transition-all duration-700 delay-200",
                heroAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              )}
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <Phone className="h-6 w-6 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">أرقام التواصل</h2>
              </div>

              <div className="space-y-4">
                {contactNumbers.map((number, index) => (
                  <a
                    key={number}
                    href={`tel:${number}`}
                    className={cn(
                      "flex items-center justify-center gap-3 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-lg md:text-xl py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105",
                      heroAnim.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
                    )}
                    style={{ transitionDelay: heroAnim.isVisible ? `${300 + index * 100}ms` : "0ms" }}
                    dir="ltr"
                  >
                    <Phone className="h-5 w-5" />
                    {number}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section ref={missionAnim.ref} className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className={cn(
                "transition-all duration-700",
                missionAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              )}
            >
              <Button asChild variant="gold" size="lg" className="hover:scale-105 transition-transform">
                <Link to="/orphans">استعرض الأيتام المتاحين للكفالة</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
