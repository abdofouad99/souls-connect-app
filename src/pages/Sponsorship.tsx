import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import { Quote, Heart, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import thankYou1 from "@/assets/thank-you-1.jpg";
import thankYou2 from "@/assets/thank-you-2.jpg";
import thankYou3 from "@/assets/thank-you-3.jpg";
import thankYou4 from "@/assets/thank-you-4.jpg";
import thankYou5 from "@/assets/thank-you-5.jpg";

const Sponsorship = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const heroAnimation = useScrollAnimation();
  const textAnimation = useScrollAnimation();
  const calloutAnimation = useScrollAnimation();
  const mediaAnimation = useScrollAnimation();
  const ctaAnimation = useScrollAnimation();

  const thankYouImages = [thankYou1, thankYou2, thankYou3, thankYou4, thankYou5];

  const handlePrevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? thankYouImages.length - 1 : selectedImage - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === thankYouImages.length - 1 ? 0 : selectedImage + 1);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section
          ref={heroAnimation.ref}
          className={`py-16 md:py-24 bg-surface/30 transition-all duration-700 ${
            heroAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-primary mb-6">كفالة الأيتام في غزة</h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              هي بصمة تمتد، وأمان يُعاد، وحياة تُبنى من جديد
            </p>
          </div>
        </section>

        {/* Main Text Section */}
        <section
          ref={textAnimation.ref}
          className={`py-12 md:py-16 transition-all duration-700 delay-100 ${
            textAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-lg text-foreground leading-loose space-y-6 text-right">
                <p className="text-lg md:text-xl">لطفل كُسرت طفولته قبل أن يشتد عوده…</p>

                <p className="text-lg md:text-xl">قوله عليه الصلاة والسلام:</p>
              </div>

              {/* Hadith Callout Card */}
              <div
                ref={calloutAnimation.ref}
                className={`my-8 md:my-12 bg-surface border-2 border-border rounded-xl p-6 md:p-8 shadow-elegant relative transition-all duration-700 delay-200 ${
                  calloutAnimation.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/30" />
                <Quote className="absolute bottom-4 left-4 w-8 h-8 text-primary/30 rotate-180" />
                <p className="text-2xl md:text-3xl font-bold text-primary text-center leading-relaxed py-4">
                  «أنا وكافل اليتيم في الجنة»
                </p>
                <p className="text-center text-muted-foreground mt-2">وأشار بالسبابة والوسطى.</p>
              </div>

              <div className="prose prose-lg text-foreground leading-loose space-y-6 text-right">
                <p className="text-lg md:text-xl">
                  حديثٌ ينبئ عن أن اليتيم ليس رقماً في قائمة المساعدات،
                  <br />
                  بل هو مشروع إنساني يجب أن يُنظر له
                  <br />
                  ولا يُجرد من أبسط مقومات الحياة.
                </p>

                <p className="text-lg md:text-xl">
                  أيتام غزة لم تُعطَ لهم الفرصة
                  <br />
                  أن يتعلموا الكلام، أو يقاسوا
                  <br />
                  مع الفقد قبل أن يعرفوا معنى الحياة…
                </p>

                <p className="text-lg md:text-xl">
                  معي لدعمه ليستمر الخير الكافل
                  <br />
                  هو اختيارك لترك بصمتك في الدنيا
                  <br />
                  وتكون أنت السبب
                  <br />
                  في حياةٍ أفضل لليتامى في غزة…
                </p>

                <p className="text-lg md:text-xl font-semibold text-primary">
                  في غزة ما يقارب 60 ألف يتيم
                  <br />
                  فقدوا السند، فقدوا الحماية
                  <br />
                  فكونوا عوناً لهم.
                </p>

                <div className="bg-surface/50 rounded-lg p-4 md:p-6 border border-border/50">
                  <p className="text-lg md:text-xl italic text-center">
                    «كفالة يتيم ما أحلى أثرها
                    <br />
                    من أحياها فكأنما
                    <br />
                    أحيا الناس جميعاً»
                  </p>
                </div>

                <p className="text-lg md:text-xl">
                  والعمل الخيري في غزة هو مشروع حياة
                  <br />
                  فكن أنت من يعيد الأمل
                  <br />
                  ويحفظ كرامة الإنسان.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Media Section */}
        <section
          ref={mediaAnimation.ref}
          className={`py-12 md:py-16 bg-surface/30 transition-all duration-700 delay-300 ${
            mediaAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              {/* Thank You Images */}
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-primary mb-6 text-center">نماذج شكر من غزة</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {thankYouImages.map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className="aspect-square bg-surface rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                    >
                      <img src={img} alt={`نموذج شكر ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Section */}
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-primary mb-6 text-center">فيديو الكفالة</h3>
                <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-elegant">
                  <div className="aspect-video relative">
                    <iframe
                      className="w-full h-full"
                      src="https://drive.google.com/file/d/1MPaZdrcRqXXR_5lWNnXeCz_rhRxddjfN/view?usp=sharing"
                      title="فيديو كفالة الأيتام"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          ref={ctaAnimation.ref}
          className={`py-16 md:py-20 transition-all duration-700 delay-400 ${
            ctaAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto bg-surface rounded-2xl p-8 md:p-12 border border-border shadow-elegant">
              <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">كن سنداً ليتيم في غزة</h2>
              <p className="text-muted-foreground mb-8 text-lg">ابدأ رحلة الكفالة واترك أثراً يدوم</p>
              <Link to="/orphans">
                <Button size="xl" className="text-lg px-8 py-6">
                  ابدأ الكفالة الآن
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Image Lightbox */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-background/95 backdrop-blur-sm border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 left-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={handleNextImage}
              className="absolute right-4 z-50 p-3 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 z-50 p-3 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Image */}
            {selectedImage !== null && (
              <img
                src={thankYouImages[selectedImage]}
                alt={`نموذج شكر ${selectedImage + 1}`}
                className="max-w-full max-h-full object-contain animate-scale-in"
              />
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-4 py-2 rounded-full text-sm text-foreground">
              {selectedImage !== null ? `${selectedImage + 1} / ${thankYouImages.length}` : ""}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Sponsorship;
