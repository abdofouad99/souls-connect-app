import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: "admin" | "sponsor" | "staff";
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "غير مصرح - يجب تسجيل الدخول" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Extract the JWT token from the authorization header
    const token = authHeader.replace("Bearer ", "");

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the current user using the token
    const { data: { user: currentUser }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !currentUser) {
      console.error("Failed to get current user:", userError);
      return new Response(
        JSON.stringify({ error: "غير مصرح - جلسة غير صالحة" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the requesting user is admin or staff
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (roleError) {
      console.error("Failed to check user role:", roleError);
      return new Response(
        JSON.stringify({ error: "خطأ في التحقق من الصلاحيات" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roleData || (roleData.role !== "admin" && roleData.role !== "staff")) {
      console.error("User is not admin or staff:", currentUser.id);
      return new Response(
        JSON.stringify({ error: "غير مصرح - يجب أن تكون مديراً أو موظفاً" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    const { email, role }: InviteRequest = await req.json();

    // Validate input
    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني والدور مطلوبان" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "صيغة البريد الإلكتروني غير صالحة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    if (!["admin", "sponsor", "staff"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "الدور غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invite the user
    console.log(`Inviting user: ${email} with role: ${role}`);
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: "https://souls-connect-app.lovable.app/set-password",
      }
    );

    if (inviteError) {
      console.error("Failed to invite user:", inviteError);
      
      // Check for specific error types
      if (inviteError.message?.includes("already registered")) {
        return new Response(
          JSON.stringify({ error: "هذا البريد الإلكتروني مسجل بالفعل" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `فشل إرسال الدعوة: ${inviteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!inviteData.user) {
      console.error("No user data returned from invite");
      return new Response(
        JSON.stringify({ error: "فشل إنشاء المستخدم" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign the role to the invited user
    console.log(`Assigning role ${role} to user ${inviteData.user.id}`);
    const { error: roleInsertError } = await adminClient
      .from("user_roles")
      .upsert(
        { user_id: inviteData.user.id, role: role },
        { onConflict: "user_id" }
      );

    if (roleInsertError) {
      console.error("Failed to assign role:", roleInsertError);
      // Don't fail the whole operation, the user is invited but role assignment failed
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "تم إرسال الدعوة لكن فشل تعيين الدور",
          user: { id: inviteData.user.id, email: inviteData.user.email }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully invited user ${email} with role ${role}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم إرسال الدعوة بنجاح",
        user: { id: inviteData.user.id, email: inviteData.user.email }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});