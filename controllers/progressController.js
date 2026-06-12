const { supabaseAdmin } = require("../config/supabase");

/**
 * GET /api/progress/:member_id
 * Trainer → can view any member's progress
 * Member  → only their own
 * Admin   → any member
 */
async function getProgressLogs(req, res) {
  try {
    const { member_id } = req.params;

    // Members can only view their own
    if (req.user.role === "member" && member_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. Not your progress log." });
    }

    const { data, error } = await supabaseAdmin
      .from("progress_logs")
      .select("*")
      .eq("member_id", member_id)
      .order("logged_at", { ascending: false });

    if (error) throw error;

    res.json({ progress_logs: data });
  } catch (err) {
    console.error("GetProgressLogs error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/progress
 * Trainer or member can log progress.
 *
 * Body: { member_id, date, weight_kg, chest_cm, waist_cm, arms_cm, legs_cm }
 */
async function createProgressLog(req, res) {
  try {
    const { member_id, date, weight_kg, chest_cm, waist_cm, arms_cm, legs_cm } =
      req.body;

    if (!member_id) {
      return res.status(400).json({ error: "member_id is required." });
    }

    // Members can only log their own progress
    if (req.user.role === "member" && member_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. You can only log your own progress." });
    }

    const { data, error } = await supabaseAdmin
      .from("progress_logs")
      .insert({
        member_id,
        logged_at: date || new Date().toISOString().split("T")[0],
        weight_kg: weight_kg || null,
        chest_cm: chest_cm || null,
        waist_cm: waist_cm || null,
        bicep_cm: arms_cm || null,
        thigh_cm: legs_cm || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Progress logged.", progress_log: data });
  } catch (err) {
    console.error("CreateProgressLog error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getProgressLogs, createProgressLog };
