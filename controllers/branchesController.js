const { supabaseAdmin } = require("../config/supabase");

async function getAllBranches(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("branches")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ branches: data });
  } catch (err) {
    console.error("GetAllBranches error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = {
  getAllBranches,
};
