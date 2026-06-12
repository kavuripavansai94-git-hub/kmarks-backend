const { supabaseAdmin } = require("../config/supabase");

/**
 * GET /api/announcements
 * All authenticated users can view.
 * If user has a role, only show announcements targeting their role OR everyone (target_role IS NULL).
 */
async function getAnnouncements(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("id, author_id, title, content, target_role, is_pinned, published_at, expires_at, created_at")
      .or(`target_role.is.null,target_role.eq.${req.user.role}`)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    if (error) throw error;

    res.json({ announcements: data });
  } catch (err) {
    console.error("GetAnnouncements error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/announcements
 * Admin only — creates an announcement.
 *
 * Body: { title, message, target_role? }
 * target_role: null = everyone, or "member" / "trainer"
 */
async function createAnnouncement(req, res) {
  try {
    const { title, message, target_role } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ error: "title and message are required." });
    }

    const { data, error } = await supabaseAdmin
      .from("announcements")
      .insert({
        author_id: req.user.user_id,
        title,
        content: message,
        target_role: target_role || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Announcement created.", announcement: data });
  } catch (err) {
    console.error("CreateAnnouncement error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAnnouncements, createAnnouncement };
