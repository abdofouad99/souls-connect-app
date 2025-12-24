import { Layout } from "@/components/layout/Layout";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const SponsorThankYou = () => {
  const [searchParams] = useSearchParams();
  const sponsorName = searchParams.get("name");
  const amount = searchParams.get("amount");
  const receiptNumber = searchParams.get("receipt");

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-primary/5 to-background py-16 px-4">
        <div className="w-full max-w-3xl">
          {/* Success Card */}
          <div className="bg-card border-2 border-primary/30 rounded-3xl shadow-card p-8 md:p-12 animate-scale-in">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="text-center mb-8">
              <p className="text-lg text-primary font-semibold">
                تمت الكفالة بنجاح، جزاكم الله خيرًا
              </p>
              {sponsorName && (
                <p className="text-muted-foreground mt-2">
                  الكافل: {sponsorName}
                </p>
              )}
              {amount && (
                <p className="text-muted-foreground">
                  مبلغ الكفالة: {amount} ريال
                </p>
              )}
            </div>

            {/* Main Title */}
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary text-center mb-8">
              شكر الكافل
            </h1>

            {/* Thank You Text */}
            <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed text-right space-y-6">
              <p className="text-xl font-semibold text-primary">
                هل تعلم ماذا يعني أنك كفلت يتيماً من أطفال غزة؟
              </p>

              <p>
                يعني أنك أمام دمعة تركها العالم كله مصلوبة على خد الطفولة، تنتظر من يمسحها فكن أنت.
              </p>

              <p>
                يعني أن مالكَ الذي قدمته، سرى في روح طفل يتيم، ودبَّ في شريانهِ كالشفاء، ومع إنتشاء كل خلية في جسمهِ المتهالك، تطالك البركة في مالك وأولادك، وتتولى الملائكة رعاية أحبابك، ويدنو الله بجلاله وكبريائه منك ولعله يهمس في أذنيك: سل تُعطَى، سل تُعطى.
              </p>

              <p>
                أتدري ياهذا أن الله فتش في قلوب العباد فوجد قلبك الطاهر مناسباً لنيل شرف الكفالة لأفضل فتية في أطهر أرض.
              </p>

              <p>
                الزمان يسجل مواقف الأقوياء الذين يتغلبون على شح أنفسهم، وذاكرة السماء تؤرشف كل ما يمنحه الإنسان للمستضعفين، والعطاءات التي تقدمها ستعود حتماً إليك بطريقة أو بأخرى،
              </p>

              <p>
                رب درهم قاد لك ألف دينار، ورب دينار اصطحب معه الأموال الكبيرة إلى خزينتك لأنك وضعته في الموضع الذي يليق به، ولأنك أكرمته وسخرته لهدف سامي.
              </p>

              <p>
                إن المال يأنف كما يأنف ابن آدم، فاجعله في متناول المستحقين
                <br />
                في بطون اليتامى الخاوية،
                <br />
                لعلها تجيد نقل الرسائل الجميلة إلى الله، وتحمل صنيعك له سبحانه، فيتولاك إلى الأبد.
              </p>

              {/* Hadith Quote */}
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 my-8 text-center">
                <p className="text-2xl font-serif font-bold text-primary mb-4">
                  "أنا وهاتين في الجنة"
                </p>
                <p className="text-muted-foreground text-base">
                  قالها من عاش تفاصيل اليتم وتجرع مرارته
                  <br />
                  قالها سيد اليتامى، قالها من لا ينطق عن الهوى، قالها من كان عطفه لليتامى دفاء.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              {receiptNumber && (
                <Button asChild variant="hero" size="lg">
                  <Link to={`/receipt/${receiptNumber}`}>
                    <FileText className="h-5 w-5" />
                    طلب سند الكفالة
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg">
                <Link to="/orphans">
                  كفالة يتيم آخر
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/">
                  العودة للرئيسية
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SponsorThankYou;
