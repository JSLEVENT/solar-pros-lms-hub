import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Create Supabase client with service role
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const courseId = session.metadata?.courseId;
      const userId = session.metadata?.userId;

      if (courseId && userId) {
        // Update payment status
        await supabaseService
          .from("payments")
          .update({ status: "completed" })
          .eq("stripe_session_id", sessionId);

        // Check if user is already enrolled
        const { data: existingEnrollment } = await supabaseService
          .from("enrollments")
          .select("*")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .single();

        if (!existingEnrollment) {
          // Create enrollment
          await supabaseService.from("enrollments").insert({
            user_id: userId,
            course_id: courseId,
            status: "active",
            progress: 0,
          });
        }

        // Create notification
        await supabaseService.from("notifications").insert({
          user_id: userId,
          title: "Payment Successful!",
          message: "Your course enrollment has been activated. You can now access your course content.",
          type: "success",
          reference_id: courseId,
          reference_type: "course",
        });

        // Track analytics event
        await supabaseService.from("analytics").insert({
          user_id: userId,
          event_type: "course_purchased",
          reference_id: courseId,
          reference_type: "course",
          metadata: {
            amount: session.amount_total,
            currency: session.currency,
            stripe_session_id: sessionId,
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment processed successfully",
          session: {
            id: session.id,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
            currency: session.currency,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Payment not completed",
          session: {
            id: session.id,
            payment_status: session.payment_status,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});