const { supabaseAdmin } = require("../config/supabase");

// GET /api/plans
async function getAllPlans(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("*")
      .order("price", { ascending: true });

    if (error) throw error;
    res.json({ plans: data || [] });
  } catch (err) {
    console.error("GetAllPlans error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

// POST /api/plans
async function createPlan(req, res) {
  try {
    const { name, description, duration, duration_days, price, includes_trainer, includes_diet } = req.body;
    const { data, error } = await supabaseAdmin
      .from("plans")
      .insert({
        name,
        description,
        duration,
        duration_days: duration_days || 30,
        price,
        includes_trainer: includes_trainer || false,
        includes_diet: includes_diet || false
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: "Plan created.", plan: data });
  } catch (err) {
    console.error("CreatePlan error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

// PUT /api/plans/:id
async function updatePlan(req, res) {
  try {
    const { name, description, duration, duration_days, price, includes_trainer, includes_diet } = req.body;
    const { data, error } = await supabaseAdmin
      .from("plans")
      .update({
        name,
        description,
        duration,
        duration_days,
        price,
        includes_trainer,
        includes_diet,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Plan updated.", plan: data });
  } catch (err) {
    console.error("UpdatePlan error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

// DELETE /api/plans/:id
async function deletePlan(req, res) {
  try {
    const { error } = await supabaseAdmin
      .from("plans")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Plan deleted." });
  } catch (err) {
    console.error("DeletePlan error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAllPlans, createPlan, updatePlan, deletePlan };
