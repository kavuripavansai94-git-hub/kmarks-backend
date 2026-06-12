const { supabaseAdmin } = require("../config/supabase");

const SESSION_SELECT = `
  id, member_id, trainer_id, scheduled_at,
  duration_min, status, location, created_at,
  session_notes (
    id, author_id, content, created_at
  )
`;

/**
 * GET /api/sessions
 * Admin   → all sessions
 * Trainer → sessions where trainer_id = req.user.user_id
 * Member  → sessions where member_id = req.user.user_id
 */
async function getSessions(req, res) {
  try {
    let query = supabaseAdmin
      .from("sessions")
      .select(SESSION_SELECT)
      .order("scheduled_at", { ascending: false });

    if (req.user.role === "trainer") {
      query = query.eq("trainer_id", req.user.user_id);
    } else if (req.user.role === "member") {
      query = query.eq("member_id", req.user.user_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ sessions: data });
  } catch (err) {
    console.error("GetSessions error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/sessions
 * Trainer creates a session with a member.
 *
 * Body: { member_id, scheduled_at, duration_min?, location? }
 */
async function createSession(req, res) {
  try {
    const { member_id, scheduled_at, duration_min, location } = req.body;

    if (!member_id || !scheduled_at) {
      return res
        .status(400)
        .json({ error: "member_id and scheduled_at are required." });
    }

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .insert({
        member_id,
        trainer_id: req.user.user_id,
        scheduled_at,
        duration_min: duration_min || 60,
        location: location || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Session created.", session: data });
  } catch (err) {
    console.error("CreateSession error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * PUT /api/sessions/:id
 * Update session status (completed / cancelled).
 * Trainer can only update their own sessions.
 *
 * Body: { status }
 */
async function updateSession(req, res) {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required." });
    }

    // Fetch session to verify ownership
    const { data: session, error: fetchErr } = await supabaseAdmin
      .from("sessions")
      .select("id, trainer_id")
      .eq("id", req.params.id)
      .single();

    if (fetchErr || !session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (req.user.role === "trainer" && session.trainer_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. Not your session." });
    }

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: "Session updated.", session: data });
  } catch (err) {
    console.error("UpdateSession error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/session-notes
 * Trainer adds a note to a session.
 *
 * Body: { session_id, content }
 */
async function addSessionNote(req, res) {
  try {
    const { session_id, content } = req.body;

    if (!session_id || !content) {
      return res
        .status(400)
        .json({ error: "session_id and content are required." });
    }

    // Verify session exists and trainer owns it
    const { data: session, error: sessErr } = await supabaseAdmin
      .from("sessions")
      .select("id, trainer_id")
      .eq("id", session_id)
      .single();

    if (sessErr || !session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (req.user.role === "trainer" && session.trainer_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. Not your session." });
    }

    const { data, error } = await supabaseAdmin
      .from("session_notes")
      .insert({
        session_id,
        author_id: req.user.user_id,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Session note added.", session_note: data });
  } catch (err) {
    console.error("AddSessionNote error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getSessions, createSession, updateSession, addSessionNote };
