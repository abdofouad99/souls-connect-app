import { Heart, Package, Home, HandHeart, Sprout, ChevronLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

const projects = [
  { icon: Heart, title: 'مشاريع الكفالات' },
  { icon: Package, title: 'مشاريع الإغاثة' },
  { icon: Home, title: 'مشاريع الإعمار' },
  { icon: HandHeart, title: 'مشاريع الإغاثية' },
  { icon: Sprout, title: 'مشاريع التنموية' },
];

export default function AboutPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-beige-light">
        <div className="container py-12 px-4 max-w-3xl mx-auto">
          
          {/* رؤيتنا */}
          <section className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brown mb-4">
              رؤيتنا
            </h2>
            <p className="text-brown-light text-lg leading-relaxed">
              الريادة في العمل الخيري لدعم الشعب الفلسطيني محلياً وإقليمياً ودولياً
            </p>
          </section>

          {/* فاصل */}
          <div className="w-full h-px bg-brown/20 my-8" />

          {/* أهدافنا */}
          <section className="mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brown text-center mb-6">
              أهدافنا
            </h2>
            <div className="bg-beige rounded-2xl p-6 shadow-card">
              <ol className="list-decimal list-inside space-y-4 text-brown-light text-lg leading-relaxed">
                <li>العمل في القضية الفلسطينية.</li>
                <li>
                  دعم الشعب الفلسطيني مادياً ومعنوياً من خلال تنفيذ المشاريع الخيرية والإنسانية المختلفة.
                </li>
                <li>مساندة قضية الأقصى والقدس الشريف.</li>
              </ol>
            </div>
          </section>

          {/* فاصل */}
          <div className="w-full h-px bg-brown/20 my-8" />

          {/* مشاريعنا */}
          <section className="mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brown text-center mb-6">
              مشاريعنا
            </h2>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-4 bg-beige rounded-xl p-4 shadow-card hover:shadow-lg hover:scale-[1.01] transition-all duration-200 group cursor-pointer"
                >
                  <div className="w-14 h-14 bg-beige-light rounded-xl flex items-center justify-center shrink-0 border border-brown/10">
                    <project.icon className="w-7 h-7 text-brown" />
                  </div>
                  <span className="text-lg font-medium text-brown flex-1 text-right">
                    {project.title}
                  </span>
                  <ChevronLeft className="w-5 h-5 text-brown/40 group-hover:text-brown transition-colors" />
                </button>
              ))}
            </div>
          </section>

          {/* فاصل */}
          <div className="w-full h-px bg-brown/20 my-8" />

          {/* فيديو مونتاج الجمعية */}
          <section className="mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brown text-center mb-6">
              فيديو مونتاج الجمعية
            </h2>
            <div className="bg-beige rounded-2xl p-4 shadow-card">
              <div className="aspect-video w-full rounded-xl overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="فيديو مونتاج الجمعية"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
