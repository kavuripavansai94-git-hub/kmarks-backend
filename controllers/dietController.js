const { supabaseAdmin } = require("../config/supabase");

const DIET_PLAN_SELECT = `
  id, member_id, trainer_id, title, description,
  daily_calories, protein_g, carbs_g, fat_g,
  start_date, end_date, is_active, created_at,
  meals (
    id, meal_type, title, description,
    calories, protein_g, carbs_g, fat_g,
    time_slot, sort_order, created_at
  )
`;

/**
 * GET /api/diet-plans/:member_id
 * Trainer → only if they created the plan (trainer_id matches)
 * Member  → only their own plans
 * Admin   → any member's plans
 */
async function getDietPlans(req, res) {
  try {
    const { member_id } = req.params;

    // Members can only view their own
    if (req.user.role === "member" && member_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. Not your diet plan." });
    }

    let query = supabaseAdmin
      .from("diet_plans")
      .select(DIET_PLAN_SELECT)
      .eq("member_id", member_id)
      .order("created_at", { ascending: false });

    // Trainers can only see plans they created
    if (req.user.role === "trainer") {
      query = query.eq("trainer_id", req.user.user_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ diet_plans: data });
  } catch (err) {
    console.error("GetDietPlans error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/diet-plans
 * Trainer creates a diet plan for a member.
 *
 * Body: { member_id, title, description?, daily_calories?,
 *         protein_g?, carbs_g?, fat_g?, start_date?, end_date? }
 */
async function createDietPlan(req, res) {
  try {
    const {
      member_id,
      title,
      description,
      daily_calories,
      protein_g,
      carbs_g,
      fat_g,
      start_date,
      end_date,
    } = req.body;

    if (!member_id || !title) {
      return res
        .status(400)
        .json({ error: "member_id and title are required." });
    }

    const { data, error } = await supabaseAdmin
      .from("diet_plans")
      .insert({
        member_id,
        trainer_id: req.user.user_id,
        title,
        description: description || null,
        daily_calories: daily_calories || null,
        protein_g: protein_g || null,
        carbs_g: carbs_g || null,
        fat_g: fat_g || null,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Diet plan created.", diet_plan: data });
  } catch (err) {
    console.error("CreateDietPlan error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/meals
 * Add a meal to a diet plan. Trainer or admin only.
 *
 * Body: { diet_plan_id, meal_type, title, description?,
 *         calories?, protein_g?, carbs_g?, fat_g?,
 *         time_slot?, sort_order? }
 */
async function addMeal(req, res) {
  try {
    const {
      diet_plan_id,
      meal_type,
      title,
      description,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      time_slot,
      sort_order,
    } = req.body;

    if (!diet_plan_id || !meal_type || !title) {
      return res
        .status(400)
        .json({ error: "diet_plan_id, meal_type, and title are required." });
    }

    // Verify diet plan exists and trainer owns it
    const { data: plan, error: planErr } = await supabaseAdmin
      .from("diet_plans")
      .select("id, trainer_id")
      .eq("id", diet_plan_id)
      .single();

    if (planErr || !plan) {
      return res.status(404).json({ error: "Diet plan not found." });
    }

    if (req.user.role === "trainer" && plan.trainer_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. Not your diet plan." });
    }

    const { data, error } = await supabaseAdmin
      .from("meals")
      .insert({
        diet_plan_id,
        meal_type,
        title,
        description: description || null,
        calories: calories || null,
        protein_g: protein_g || null,
        carbs_g: carbs_g || null,
        fat_g: fat_g || null,
        time_slot: time_slot || null,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Meal added.", meal: data });
  } catch (err) {
    console.error("AddMeal error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getDietPlans, createDietPlan, addMeal };
