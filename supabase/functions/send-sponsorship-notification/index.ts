import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SponsorshipNotificationRequest {
  sponsorName: string;
  sponsorEmail: string;
  sponsorPhone?: string;
  orphanName: string;
  sponsorshipType: string;
  paymentMethod: string;
  monthlyAmount: number;
  receiptNumber: string;
  hasReceiptImage: boolean;
}

// دالة لتنظيف المدخلات ومنع XSS
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// دالة للتحقق من صحة المدخلات
const validateInput = (data: SponsorshipNotificationRequest): { valid: boolean; error?: string } => {
  if (!data.sponsorName || data.sponsorName.length < 2 || data.sponsorName.length > 100) {
    return { valid: false, error: "اسم الكفيل غير صالح" };
  }
  
  if (!data.sponsorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.sponsorEmail)) {
    return { valid: false, error: "البريد الإلكتروني غير صالح" };
  }
  
  if (!data.orphanName || data.orphanName.length < 2 || data.orphanName.length > 100) {
    return { valid: false, error: "اسم اليتيم غير صالح" };
  }
  
  if (!data.monthlyAmount || data.monthlyAmount <= 0) {
    return { valid: false, error: "مبلغ الكفالة غير صالح" };
  }
  
  if (!data.receiptNumber) {
    return { valid: false, error: "رقم الإيصال غير صالح" };
  }
  
  return { valid: true };
};

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    bank_transfer: 'تحويل بنكي',
    credit_card: 'بطاقة ائتمان',
    cash: 'نقداً',
  };
  return labels[method] || method;
};

const getSponsorshipTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    monthly: 'شهرية',
    yearly: 'سنوية',
  };
  return labels[type] || type;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send sponsorship notification");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ADMIN_EMAIL) {
      console.error("ADMIN_EMAIL environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const requestData: SponsorshipNotificationRequest = await req.json();
    
    // التحقق من صحة المدخلات
    const validation = validateInput(requestData);
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { 
      sponsorName, 
      sponsorEmail, 
      sponsorPhone, 
      orphanName, 
      sponsorshipType, 
      paymentMethod, 
      monthlyAmount, 
      receiptNumber,
      hasReceiptImage 
    } = requestData;

    // تنظيف المدخلات
    const safeSponsorName = escapeHtml(sponsorName);
    const safeSponsorEmail = escapeHtml(sponsorEmail);
    const safeSponsorPhone = sponsorPhone ? escapeHtml(sponsorPhone) : 'غير محدد';
    const safeOrphanName = escapeHtml(orphanName);
    const safeReceiptNumber = escapeHtml(receiptNumber);

    const totalAmount = sponsorshipType === 'yearly' ? monthlyAmount * 12 : monthlyAmount;

    console.log("Sending sponsorship notification:", { 
      sponsorName: safeSponsorName, 
      orphanName: safeOrphanName,
      amount: totalAmount,
      adminEmail: ADMIN_EMAIL 
    });

    // إرسال بريد للمشرف
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "نظام الكفالة <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🎉 كفالة جديدة - ${safeOrphanName}`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #FBFBF0; margin: 0; padding: 20px; direction: rtl; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #4D3116, #6B4423); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .header p { margin: 10px 0 0; opacity: 0.9; }
              .content { padding: 30px; }
              .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; margin-bottom: 20px; }
              .info-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-right: 4px solid #4D3116; }
              .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
              .info-row:last-child { border-bottom: none; }
              .info-label { color: #64748b; font-size: 14px; }
              .info-value { color: #1e293b; font-weight: 600; font-size: 14px; }
              .amount { font-size: 32px; color: #4D3116; font-weight: bold; text-align: center; margin: 20px 0; }
              .amount-label { font-size: 14px; color: #64748b; text-align: center; margin-top: -15px; }
              .receipt-badge { background: ${hasReceiptImage ? '#10b981' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
              .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 كفالة جديدة!</h1>
                <p>تم تسجيل كفالة جديدة في النظام</p>
              </div>
              <div class="content">
                <div style="text-align: center;">
                  <span class="success-badge">✓ تم التسجيل بنجاح</span>
                </div>
                
                <div class="amount">${totalAmount.toLocaleString('ar-SA')} ر.س</div>
                <p class="amount-label">قيمة الكفالة ${getSponsorshipTypeLabel(sponsorshipType)}</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0; color: #4D3116;">بيانات اليتيم</h3>
                  <div class="info-row">
                    <span class="info-label">اسم اليتيم</span>
                    <span class="info-value">${safeOrphanName}</span>
                  </div>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #4D3116;">بيانات الكفيل</h3>
                  <div class="info-row">
                    <span class="info-label">الاسم</span>
                    <span class="info-value">${safeSponsorName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">البريد الإلكتروني</span>
                    <span class="info-value" dir="ltr">${safeSponsorEmail}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">رقم الجوال</span>
                    <span class="info-value" dir="ltr">${safeSponsorPhone}</span>
                  </div>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #4D3116;">تفاصيل الكفالة</h3>
                  <div class="info-row">
                    <span class="info-label">رقم الإيصال</span>
                    <span class="info-value" dir="ltr">${safeReceiptNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">نوع الكفالة</span>
                    <span class="info-value">${getSponsorshipTypeLabel(sponsorshipType)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">طريقة الدفع</span>
                    <span class="info-value">${getPaymentMethodLabel(paymentMethod)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">صورة الإيصال</span>
                    <span class="receipt-badge">${hasReceiptImage ? 'مرفقة ✓' : 'غير مرفقة'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">تاريخ التسجيل</span>
                    <span class="info-value">${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <p style="color: #475569; text-align: center; margin-top: 30px;">
                  يمكنك مراجعة تفاصيل الكفالة من لوحة التحكم
                </p>
              </div>
              <div class="footer">
                <p>هذا البريد تم إرساله تلقائياً من نظام إدارة الكفالات</p>
                <p style="margin-top: 10px;">جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const adminEmailData = await adminEmailResponse.json();
    console.log("Admin email API response:", adminEmailData);

    // إرسال بريد تأكيد للكفيل
    const sponsorEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "نظام الكفالة <onboarding@resend.dev>",
        to: [sponsorEmail],
        subject: `تأكيد كفالتك لليتيم ${safeOrphanName}`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #FBFBF0; margin: 0; padding: 20px; direction: rtl; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #4D3116, #6B4423); color: white; padding: 40px 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .header p { margin: 15px 0 0; opacity: 0.9; font-size: 16px; }
              .content { padding: 30px; }
              .thank-you { text-align: center; padding: 20px 0; }
              .thank-you h2 { color: #4D3116; font-size: 24px; margin: 0; }
              .thank-you p { color: #64748b; font-size: 16px; line-height: 1.8; margin: 15px 0 0; }
              .hadith-box { background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border: 2px solid #f59e0b; }
              .hadith-text { font-size: 20px; color: #92400e; font-weight: bold; line-height: 1.8; }
              .hadith-source { font-size: 14px; color: #b45309; margin-top: 10px; }
              .info-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-right: 4px solid #10b981; }
              .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
              .info-row:last-child { border-bottom: none; }
              .info-label { color: #64748b; font-size: 14px; }
              .info-value { color: #1e293b; font-weight: 600; font-size: 14px; }
              .amount-box { background: linear-gradient(135deg, #4D3116, #6B4423); color: white; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
              .amount { font-size: 36px; font-weight: bold; margin: 0; }
              .amount-label { font-size: 14px; opacity: 0.9; margin-top: 5px; }
              .receipt-box { background: #ecfdf5; border: 2px dashed #10b981; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
              .receipt-number { font-size: 18px; font-weight: bold; color: #059669; font-family: monospace; }
              .footer { background: #f8fafc; padding: 25px; text-align: center; color: #64748b; font-size: 12px; }
              .social-note { background: #eff6ff; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; color: #1e40af; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🤲 جزاك الله خيراً</h1>
                <p>تم تسجيل كفالتك بنجاح</p>
              </div>
              <div class="content">
                <div class="thank-you">
                  <h2>شكراً لك ${safeSponsorName}</h2>
                  <p>
                    بارك الله فيك وفي مالك، وجعل كفالتك لليتيم ${safeOrphanName} في ميزان حسناتك.
                    <br>
                    أنت الآن شريك في إعادة البسمة لطفل يتيم في غزة.
                  </p>
                </div>

                <div class="hadith-box">
                  <p class="hadith-text">«أنا وكافل اليتيم في الجنة هكذا»</p>
                  <p class="hadith-text">وأشار بالسبابة والوسطى</p>
                  <p class="hadith-source">- رواه البخاري</p>
                </div>

                <div class="amount-box">
                  <p class="amount">${totalAmount.toLocaleString('ar-SA')} ر.س</p>
                  <p class="amount-label">قيمة الكفالة ${getSponsorshipTypeLabel(sponsorshipType)}</p>
                </div>

                <div class="receipt-box">
                  <p style="margin: 0 0 5px; color: #059669; font-size: 14px;">رقم الإيصال</p>
                  <p class="receipt-number">${safeReceiptNumber}</p>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #10b981;">تفاصيل الكفالة</h3>
                  <div class="info-row">
                    <span class="info-label">اسم اليتيم</span>
                    <span class="info-value">${safeOrphanName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">نوع الكفالة</span>
                    <span class="info-value">${getSponsorshipTypeLabel(sponsorshipType)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">طريقة الدفع</span>
                    <span class="info-value">${getPaymentMethodLabel(paymentMethod)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">تاريخ الكفالة</span>
                    <span class="info-value">${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>

                <div class="social-note">
                  <p style="margin: 0;">💝 شارك أجر الكفالة مع أحبابك وادعهم للمشاركة في هذا العمل الخيري</p>
                </div>
              </div>
              <div class="footer">
                <p style="font-size: 14px; color: #4D3116; margin-bottom: 10px;">
                  نسأل الله أن يتقبل منك ويجعلها في موازين حسناتك
                </p>
                <p>هذا البريد تم إرساله تلقائياً من نظام إدارة الكفالات</p>
                <p style="margin-top: 10px;">جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const sponsorEmailData = await sponsorEmailResponse.json();
    console.log("Sponsor email API response:", sponsorEmailData);

    if (!adminEmailResponse.ok) {
      console.error("Failed to send admin email:", adminEmailData);
    }

    if (!sponsorEmailResponse.ok) {
      console.error("Failed to send sponsor email:", sponsorEmailData);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      adminEmailId: adminEmailData.id,
      sponsorEmailId: sponsorEmailData.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-sponsorship-notification function:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء إرسال الإشعار" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
