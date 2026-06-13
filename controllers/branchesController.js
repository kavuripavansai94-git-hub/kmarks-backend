const { supabaseAdmin } = require("../config/supabase");

async function getAllBranches(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("branches")
      .select("*, manager:users(id, name)")
      .order("created_at", { ascending: true });

    if (error) throw error;
    
    // Transform manager to just be manager_name and manager_id for frontend simplicity
    const branches = data.map(b => ({
      ...b,
      manager_name: b.manager ? b.manager.name : 'Unassigned',
      manager_id: b.manager ? b.manager.id : null
    }));

    res.json({ branches });
  } catch (err) {
    console.error("GetAllBranches error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function createBranch(req, res) {
  try {
    const { name, location, status, manager_id } = req.body;
    
    const payload = {
      name,
      location,
      status: status || 'ACTIVE',
      manager_id: manager_id || null
    };

    const { data, error } = await supabaseAdmin
      .from("branches")
      .insert([payload])
      .select("*, manager:users(id, name)")
      .single();

    if (error) throw error;
    
    const branch = {
      ...data,
      manager_name: data.manager ? data.manager.name : 'Unassigned',
      manager_id: data.manager ? data.manager.id : null
    };

    res.status(201).json({ branch });
  } catch (err) {
    console.error("CreateBranch error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function updateBranch(req, res) {
  try {
    const { id } = req.params;
    const { name, location, status, manager_id } = req.body;

    const payload = {
      name,
      location,
      status,
      manager_id: manager_id || null,
      updated_at: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const { data, error } = await supabaseAdmin
      .from("branches")
      .update(payload)
      .eq("id", id)
      .select("*, manager:users(id, name)")
      .single();

    if (error) throw error;

    const branch = {
      ...data,
      manager_name: data.manager ? data.manager.name : 'Unassigned',
      manager_id: data.manager ? data.manager.id : null
    };

    res.json({ branch });
  } catch (err) {
    console.error("UpdateBranch error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function deleteBranch(req, res) {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseAdmin
      .from("branches")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    console.error("DeleteBranch error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch
};
