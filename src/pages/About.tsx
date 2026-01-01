import { Heart, Package, Home, HandHeart, Sprout, ChevronLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

const projects = [
  { icon: Home, title: 'مشاريع المسجد الأقصى والقدس الشريف' },
  { icon: Heart, title: 'مشاريع الكفالات' },
  { icon: HandHeart, title: 'المشاريع الإغاثية' },
  { icon: Package, title: 'المشاريع الصحية' },
  { icon: Sprout, title: 'المشاريع التعليمية' },
  { icon: Sprout, title: 'المشاريع التنموية' },
];

export default function AboutPage() {
  const visionAnim = useScrollAnimation<HTMLElement>();
  const goalsAnim = useScrollAnimation<HTMLElement>();
  const projectsAnim = useScrollAnimation<HTMLElement>();
  const videoAnim = useScrollAnimation<HTMLElement>();

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container py-12 px-4 max-w-3xl mx-auto">
          
          {/* رؤيتنا */}
          <section 
            ref={visionAnim.ref}
            className="text-center mb-10"
          >
            <h2 
              className={cn(
                "text-3xl md:text-4xl font-serif font-bold mb-4 transition-all duration-700",
                visionAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              رؤيتنا
            </h2>
            <p 
              className={cn(
                "text-muted-foreground text-lg leading-relaxed transition-all duration-700 delay-100",
                visionAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              الريادة في العمل الخيري لدعم الشعب الفلسطيني محلياً وإقليمياً ودولياً
            </p>
          </section>

          {/* فاصل */}
          <div className="w-full h-px bg-border my-8" />

          {/* أهدافنا */}
          <section 
            ref={goalsAnim.ref}
            className="mb-10"
          >
            <h2 
              className={cn(
                "text-3xl md:text-4xl font-serif font-bold text-center mb-6 transition-all duration-700",
                goalsAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              أهدافنا
            </h2>
            <div 
              className={cn(
                "bg-card rounded-2xl p-6 shadow-card transition-all duration-700 delay-100",
                goalsAnim.isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
              )}
            >
              <ol className="list-decimal list-inside space-y-4 text-muted-foreground text-lg leading-relaxed">
                <li>التعريف بالقضية الفلسطينية.</li>
                <li>
                  دعم الشعب الفلسطيني مادياً ومعنوياً من خلال تنفيذ المشاريع الخيرية والإنسانية المختلفة.
                </li>
                <li>مساندة قضية الأقصى والقدس الشريف.</li>
              </ol>
            </div>
          </section>

          {/* فاصل */}
          <div className="w-full h-px bg-border my-8" />

          {/* مشاريعنا */}
          <section 
            ref={projectsAnim.ref}
            className="mb-10"
          >
            <h2 
              className={cn(
                "text-3xl md:text-4xl font-serif font-bold text-center mb-6 transition-all duration-700",
                projectsAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              مشاريعنا
            </h2>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-full flex items-center gap-4 bg-card rounded-xl p-4 shadow-card transition-all duration-300",
                    projectsAnim.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                  )}
                  style={{ transitionDelay: projectsAnim.isVisible ? `${100 + index * 80}ms` : '0ms' }}
                >
                  <div className="w-14 h-14 bg-background rounded-xl flex items-center justify-center shrink-0 border border-border">
                    <project.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-lg font-medium text-foreground flex-1 text-right">
                    {project.title}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* فاصل */}
          <div className="w-full h-px bg-border my-8" />

          {/* فيديو مونتاج الجمعية */}
          <section 
            ref={videoAnim.ref}
            className="mb-10"
          >
            <h2 
              className={cn(
                "text-3xl md:text-4xl font-serif font-bold text-center mb-6 transition-all duration-700",
                videoAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              فيديو مونتاج الجمعية
            </h2>
            <div 
              className={cn(
                "bg-card rounded-2xl p-4 shadow-card transition-all duration-700 delay-100",
                videoAnim.isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
              )}
            >
              <div className="aspect-video w-full rounded-xl overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src="https://drive.google.com/file/d/1FLVCVSlCuTczk3d4YpBfGD6NkRQkGDwV/preview"
                  title="فيديو مونتاج الجمعية"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
