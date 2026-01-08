import { Phone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import heroImage from "@/assets/hero-image.jpg";
import { cn } from "@/lib/utils";

const Index = () => {
  const heroAnim = useScrollAnimation<HTMLElement>();

  const contactNumbers = ["04251675", "784665006"];

  return (
    <Layout>
      {/* Hero Section */}
      <section ref={heroAnim.ref} className="py-12 md:py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            {/* الصورة الرئيسية */}
            <div
              className={cn(
                "mb-12 transition-all duration-700",
                heroAnim.isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95",
              )}
            >
              <img
                src={heroImage}
                alt="مشروع كفالة الأيتام - جمعية الأقصى"
                className="w-full max-w-3xl mx-auto rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
              />
            </div>

            {/* العنوان مع الزخرفة */}
            <div
              className={cn(
                "mb-12 transition-all duration-700 delay-150",
                heroAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              )}
            >
              {/* خط زخرفي علوي */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-[2px] w-16 md:w-24 bg-gradient-to-r from-transparent via-primary to-primary rounded-full" />
                <div className="h-3 w-3 rotate-45 bg-primary rounded-sm" />
                <div className="h-[2px] w-16 md:w-24 bg-gradient-to-l from-transparent via-primary to-primary rounded-full" />
              </div>

              {/* العنوان الرئيسي */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-relaxed">
                جمعية الأقصى
              </h1>
              <p className="text-2xl md:text-3xl lg:text-4xl font-serif text-primary mt-2">
                المكتب النسوي _ تعز
              </p>

              {/* خط زخرفي سفلي */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="h-[2px] w-16 md:w-24 bg-gradient-to-r from-transparent via-primary to-primary rounded-full" />
                <div className="h-3 w-3 rotate-45 bg-primary rounded-sm" />
                <div className="h-[2px] w-16 md:w-24 bg-gradient-to-l from-transparent via-primary to-primary rounded-full" />
              </div>
            </div>

            {/* قسم أرقام التواصل */}
            <div
              className={cn(
                "bg-card rounded-2xl p-6 md:p-8 shadow-card max-w-md mx-auto transition-all duration-700 delay-300",
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
                    style={{ transitionDelay: heroAnim.isVisible ? `${400 + index * 100}ms` : "0ms" }}
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

    </Layout>
  );
};

export default Index;
