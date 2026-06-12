const { supabaseAdmin } = require("../config/supabase");

/**
 * GET /api/attendance/:member_id
 * Admin   → any member
 * Trainer → any member (they need to see attendance)
 * Member  → only their own
 */
async function getAttendance(req, res) {
  try {
    const { member_id } = req.params;

    // Members can only view their own
    if (req.user.role === "member" && member_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. Not your attendance record." });
    }

    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select("id, member_id, check_in, check_out, created_at")
      .eq("member_id", member_id)
      .order("check_in", { ascending: false });

    if (error) throw error;

    res.json({ attendance: data });
  } catch (err) {
    console.error("GetAttendance error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/attendance
 * Trainer marks a member present.
 *
 * Body: { member_id, date }
 */
async function markAttendance(req, res) {
  try {
    const { member_id, date } = req.body;

    if (!member_id || !date) {
      return res
        .status(400)
        .json({ error: "member_id and date are required." });
    }

    const { data, error } = await supabaseAdmin
      .from("attendance")
      .insert({
        member_id,
        check_in: new Date(date).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Attendance marked.", attendance: data });
  } catch (err) {
    console.error("MarkAttendance error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function getAllAttendance(req, res) {
  try {
    let query = supabaseAdmin
      .from("attendance")
      .select(`
        id, member_id, check_in, check_out, created_at,
        users:member_id ( id, name )
      `)
      .order("check_in", { ascending: false });

    if (req.query.date === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query = query.gte("check_in", todayStart.toISOString()).lte("check_in", todayEnd.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ attendance: data });
  } catch (err) {
    console.error("GetAllAttendance error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAttendance, markAttendance, getAllAttendance };
