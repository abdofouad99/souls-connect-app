import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DepositNotificationRequest {
  sponsorName: string;
  phoneNumber: string;
  depositAmount: number;
  bankMethod: string;
  adminEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send deposit notification");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sponsorName, phoneNumber, depositAmount, bankMethod, adminEmail }: DepositNotificationRequest = await req.json();

    console.log("Sending notification for deposit request:", { sponsorName, depositAmount, adminEmail });

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "نظام الكفالة <onboarding@resend.dev>",
        to: [adminEmail],
        subject: "طلب سند إيداع جديد",
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 30px; }
              .info-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
              .info-row:last-child { border-bottom: none; }
              .info-label { color: #64748b; font-size: 14px; }
              .info-value { color: #1e293b; font-weight: 600; font-size: 14px; }
              .amount { font-size: 28px; color: #10b981; font-weight: bold; text-align: center; margin: 20px 0; }
              .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 طلب سند إيداع جديد</h1>
              </div>
              <div class="content">
                <p style="color: #475569; line-height: 1.8;">تم استلام طلب سند إيداع جديد، يرجى مراجعته واتخاذ الإجراء المناسب.</p>
                
                <div class="amount">${depositAmount.toLocaleString('ar-SA')} ر.س</div>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">اسم الكفيل</span>
                    <span class="info-value">${sponsorName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">رقم الجوال</span>
                    <span class="info-value" dir="ltr">${phoneNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">طريقة التحويل</span>
                    <span class="info-value">${bankMethod}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">تاريخ الطلب</span>
                    <span class="info-value">${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <p style="color: #475569; text-align: center;">
                  يمكنك مراجعة الطلب من لوحة التحكم
                </p>
              </div>
              <div class="footer">
                <p>هذا البريد تم إرساله تلقائياً من نظام إدارة الكفالات</p>
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
    console.error("Error in send-deposit-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
