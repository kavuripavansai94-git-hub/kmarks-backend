const { supabaseAdmin } = require("../config/supabase");

/**
 * GET /api/payments
 * Admin only — returns all payments with member info.
 */
async function getAllPayments(req, res) {
  try {
    let query = supabaseAdmin
      .from("payments")
      .select(`
        id, member_id, plan_id, amount, currency,
        payment_method, status, transaction_id,
        paid_at, period_start, period_end, due_date:period_end, notes,
        created_at, updated_at,
        users:member_id ( id, name, email, phone )
      `);

    if (req.query.status) {
      if (req.query.status === "overdue") {
        // overdue = due_date < today AND status = 'pending'
        // In the PostgreSQL database schema, the 'due_date' is represented by the 'period_end' column
        const today = new Date().toISOString().split("T")[0];
        query = query.eq("status", "pending").lt("period_end", today);
      } else {
        query = query.eq("status", req.query.status);
      }
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ payments: data });
  } catch (err) {
    console.error("GetAllPayments error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/payments
 * Admin creates a payment record.
 *
 * Body: { member_id, plan_id?, amount, payment_method?,
 *         transaction_id?, period_start?, period_end?, notes? }
 */
async function createPayment(req, res) {
  try {
    const {
      member_id,
      plan_id,
      amount,
      payment_method,
      transaction_id,
      period_start,
      period_end,
      notes,
    } = req.body;

    if (!member_id || !amount) {
      return res
        .status(400)
        .json({ error: "member_id and amount are required." });
    }

    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        member_id,
        plan_id: plan_id || null,
        amount,
        payment_method: payment_method || "cash",
        status: "pending",
        transaction_id: transaction_id || null,
        period_start: period_start || null,
        period_end: period_end || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Payment created.", payment: data });
  } catch (err) {
    console.error("CreatePayment error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * PUT /api/payments/:id
 * Admin updates payment status (paid / pending / overdue).
 *
 * Body: { status, paid_at? }
 */
async function updatePayment(req, res) {
  try {
    const { status, paid_at } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required." });
    }

    const updatePayload = { status };

    // Auto-set paid_at when marking as completed
    if (status === "completed" && !paid_at) {
      updatePayload.paid_at = new Date().toISOString();
    } else if (paid_at) {
      updatePayload.paid_at = paid_at;
    }

    const { data, error } = await supabaseAdmin
      .from("payments")
      .update(updatePayload)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Payment not found." });

    res.json({ message: "Payment updated.", payment: data });
  } catch (err) {
    console.error("UpdatePayment error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAllPayments, createPayment, updatePayment };
