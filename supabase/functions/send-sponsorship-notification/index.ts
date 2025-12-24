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

    const emailResponse = await fetch("https://api.resend.com/emails", {
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
              .cta-button { display: inline-block; background: #4D3116; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
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

    const emailData = await emailResponse.json();
    console.log("Email API response:", emailData);

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
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
