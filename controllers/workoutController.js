const { supabaseAdmin } = require("../config/supabase");

// Full plan select with nested days → exercises
const PLAN_LIST_SELECT = `
  id, member_id, trainer_id, title, description,
  start_date, end_date, is_active, created_at
`;

const PLAN_DETAIL_SELECT = `
  id, member_id, trainer_id, title, description,
  start_date, end_date, is_active, created_at,
  workout_days (
    id, day, focus_area, notes, created_at,
    exercises (
      id, name, sets, reps, weight_kg,
      rest_seconds, duration_minutes, notes, sort_order, created_at
    )
  )
`;

// ─── WORKOUT PLANS ───────────────────────────────────────────

/**
 * GET /api/workout-plans
 * Admin   → all plans
 * Trainer → plans where trainer_id = req.user.user_id
 * Member  → plans where member_id = req.user.user_id
 */
async function getAllPlans(req, res) {
  try {
    let query = supabaseAdmin
      .from("workout_plans")
      .select(PLAN_LIST_SELECT)
      .order("created_at", { ascending: false });

    if (req.user.role === "trainer") {
      query = query.eq("trainer_id", req.user.user_id);
    } else if (req.user.role === "member") {
      query = query.eq("member_id", req.user.user_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ workout_plans: data });
  } catch (err) {
    console.error("GetAllPlans error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * GET /api/workout-plans/:id
 * Returns full plan with days + exercises.
 * Members can only view their own plan.
 */
async function getPlanById(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("workout_plans")
      .select(PLAN_DETAIL_SELECT)
      .eq("id", req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Workout plan not found." });
    }

    // Members can only view their own plan
    if (req.user.role === "member" && data.member_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. This is not your plan." });
    }

    // Trainers can only view plans they created
    if (req.user.role === "trainer" && data.trainer_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. Not your assigned plan." });
    }

    res.json({ workout_plan: data });
  } catch (err) {
    console.error("GetPlanById error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/workout-plans
 * Trainer or admin creates a plan for a member.
 *
 * Body: { member_id, title, description?, start_date?, end_date? }
 */
async function createPlan(req, res) {
  try {
    const { member_id, title, description, start_date, end_date } = req.body;

    if (!member_id || !title) {
      return res
        .status(400)
        .json({ error: "member_id and title are required." });
    }

    const { data, error } = await supabaseAdmin
      .from("workout_plans")
      .insert({
        member_id,
        trainer_id: req.user.user_id,
        title,
        description: description || null,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Workout plan created.",
      workout_plan: data,
    });
  } catch (err) {
    console.error("CreatePlan error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * DELETE /api/workout-plans/:id
 * Trainer (owner) or admin only.
 */
async function deletePlan(req, res) {
  try {
    // Fetch plan to check ownership
    const { data: plan, error: fetchErr } = await supabaseAdmin
      .from("workout_plans")
      .select("id, trainer_id")
      .eq("id", req.params.id)
      .single();

    if (fetchErr || !plan) {
      return res.status(404).json({ error: "Workout plan not found." });
    }

    // Trainers can only delete their own plans
    if (req.user.role === "trainer" && plan.trainer_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. Not your plan." });
    }

    // CASCADE deletes workout_days → exercises
    const { error } = await supabaseAdmin
      .from("workout_plans")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Workout plan deleted." });
  } catch (err) {
    console.error("DeletePlan error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ─── WORKOUT DAYS ────────────────────────────────────────────

/**
 * POST /api/workout-days
 * Add a day to a workout plan.
 *
 * Body: { workout_plan_id, day, focus_area?, notes? }
 */
async function createDay(req, res) {
  try {
    const { workout_plan_id, day, focus_area, notes } = req.body;

    if (!workout_plan_id || !day) {
      return res
        .status(400)
        .json({ error: "workout_plan_id and day are required." });
    }

    // Verify the plan exists and trainer owns it
    const { data: plan, error: planErr } = await supabaseAdmin
      .from("workout_plans")
      .select("id, trainer_id")
      .eq("id", workout_plan_id)
      .single();

    if (planErr || !plan) {
      return res.status(404).json({ error: "Workout plan not found." });
    }

    if (req.user.role === "trainer" && plan.trainer_id !== req.user.user_id) {
      return res.status(403).json({ error: "Forbidden. Not your plan." });
    }

    const { data, error } = await supabaseAdmin
      .from("workout_days")
      .insert({
        workout_plan_id,
        day,
        focus_area: focus_area || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Workout day added.", workout_day: data });
  } catch (err) {
    console.error("CreateDay error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * DELETE /api/workout-days/:id
 * Deletes a day + its exercises (CASCADE).
 */
async function deleteDay(req, res) {
  try {
    // Fetch day → plan to verify ownership
    const { data: day, error: dayErr } = await supabaseAdmin
      .from("workout_days")
      .select("id, workout_plan_id, workout_plans:workout_plan_id ( trainer_id )")
      .eq("id", req.params.id)
      .single();

    if (dayErr || !day) {
      return res.status(404).json({ error: "Workout day not found." });
    }

    if (
      req.user.role === "trainer" &&
      day.workout_plans?.trainer_id !== req.user.user_id
    ) {
      return res.status(403).json({ error: "Forbidden. Not your plan." });
    }

    // CASCADE deletes exercises
    const { error } = await supabaseAdmin
      .from("workout_days")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Workout day and its exercises deleted." });
  } catch (err) {
    console.error("DeleteDay error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ─── EXERCISES ───────────────────────────────────────────────

/**
 * POST /api/workout-days/:id/exercises
 * Add an exercise to a workout day.
 *
 * Body: { name, sets?, reps?, weight_kg?, rest_seconds?,
 *         duration_minutes?, notes?, sort_order? }
 */
async function addExercise(req, res) {
  try {
    const workout_day_id = req.params.id;
    const {
      name,
      sets,
      reps,
      weight_kg,
      rest_seconds,
      duration_minutes,
      notes,
      sort_order,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Exercise name is required." });
    }

    // Verify day exists and trainer owns the parent plan
    const { data: day, error: dayErr } = await supabaseAdmin
      .from("workout_days")
      .select("id, workout_plan_id, workout_plans:workout_plan_id ( trainer_id )")
      .eq("id", workout_day_id)
      .single();

    if (dayErr || !day) {
      return res.status(404).json({ error: "Workout day not found." });
    }

    if (
      req.user.role === "trainer" &&
      day.workout_plans?.trainer_id !== req.user.user_id
    ) {
      return res.status(403).json({ error: "Forbidden. Not your plan." });
    }

    const { data, error } = await supabaseAdmin
      .from("exercises")
      .insert({
        workout_day_id,
        name,
        sets: sets || null,
        reps: reps || null,
        weight_kg: weight_kg || null,
        rest_seconds: rest_seconds || null,
        duration_minutes: duration_minutes || null,
        notes: notes || null,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Exercise added.", exercise: data });
  } catch (err) {
    console.error("AddExercise error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  deletePlan,
  createDay,
  deleteDay,
  addExercise,
};
