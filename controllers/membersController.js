const bcrypt = require("bcryptjs");
const { supabaseAdmin } = require("../config/supabase");

// Select string used across queries — members joined with their user data
const MEMBER_SELECT = `
  id,
  user_id,
  plan_id,
  joined_at,
  membership_end,
  assigned_trainer_id,
  date_of_birth,
  gender,
  height_cm,
  weight_kg,
  address,
  emergency_contact_name,
  emergency_contact_phone,
  medical_conditions,
  fitness_goal,
  created_at,
  users:user_id ( id, name, email, phone, role )
`;

/**
 * GET /api/members
 * Admin  → returns ALL members
 * Trainer → returns only members assigned to them
 */
async function getAllMembers(req, res) {
  try {
    let query = supabaseAdmin
      .from("members")
      .select(MEMBER_SELECT);

    // Trainers can only see their own assigned members
    if (req.user.role === "trainer") {
      query = query.eq("assigned_trainer_id", req.user.user_id);
    }

    if (req.query.expiring === "soon") {
      const today = new Date().toISOString().split("T")[0];
      const soonThreshold = new Date();
      soonThreshold.setDate(soonThreshold.getDate() + 30);
      const soonIso = soonThreshold.toISOString().split("T")[0];
      query = query.gte("membership_end", today).lte("membership_end", soonIso);
    }

    if (req.query.limit) {
      query = query.limit(parseInt(req.query.limit));
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ members: data });
  } catch (err) {
    console.error("GetAllMembers error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * GET /api/members/:id
 * Admin  → can view any member
 * Trainer → can only view if assigned_trainer_id matches
 */
async function getMemberById(req, res) {
  try {
    let query = supabaseAdmin
      .from("members")
      .select(MEMBER_SELECT)
      .eq("id", req.params.id)
      .single();

    const { data, error } = await query;

    if (error || !data) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Trainers can only view their own assigned members
    if (
      req.user.role === "trainer" &&
      data.assigned_trainer_id !== req.user.user_id
    ) {
      return res.status(403).json({ error: "Forbidden. Not your assigned member." });
    }

    res.json({ member: data });
  } catch (err) {
    console.error("GetMemberById error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/members
 * Admin only — creates a user account (role: 'member', password: 'kmarks123')
 * and a corresponding row in the members table.
 *
 * Body: { name, email, phone, plan_id, trainer_id, join_date, expiry_date }
 */
async function createMember(req, res) {
  try {
    const { name, email, phone, plan_id, trainer_id, join_date, expiry_date } =
      req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required." });
    }

    // Check if email already taken
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash("kmarks123", salt);

    // 1. Create user account
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert({ name, email, phone, password_hash, role: "member" })
      .select("id, name, email, phone, role, created_at")
      .single();

    if (userError) throw userError;

    // 2. Create member profile
    const { data: member, error: memberError } = await supabaseAdmin
      .from("members")
      .insert({
        user_id: user.id,
        assigned_trainer_id: trainer_id || null,
        plan_id: plan_id || null,
        joined_at: join_date || new Date().toISOString().split("T")[0],
        membership_end: expiry_date || null,
      })
      .select()
      .single();

    if (memberError) {
      // Rollback: delete the user we just created
      await supabaseAdmin.from("users").delete().eq("id", user.id);
      throw memberError;
    }

    res.status(201).json({
      message: "Member created successfully.",
      member: { ...member, user },
    });
  } catch (err) {
    console.error("CreateMember error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * PUT /api/members/:id
 * Admin only — updates member profile and optionally the user record.
 *
 * Body: { name?, email?, phone?, trainer_id?, join_date?, expiry_date?,
 *         date_of_birth?, gender?, height_cm?, weight_kg?, address?,
 *         emergency_contact_name?, emergency_contact_phone?,
 *         medical_conditions?, fitness_goal? }
 */
async function updateMember(req, res) {
  try {
    const {
      name,
      email,
      phone,
      trainer_id,
      join_date,
      expiry_date,
      date_of_birth,
      gender,
      height_cm,
      weight_kg,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      medical_conditions,
      fitness_goal,
      plan_id,
    } = req.body;

    // Fetch current member to get user_id
    const { data: current, error: fetchError } = await supabaseAdmin
      .from("members")
      .select("user_id")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !current) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Build member update payload (only include provided fields)
    const memberUpdate = {};
    if (trainer_id !== undefined) memberUpdate.assigned_trainer_id = trainer_id;
    if (plan_id !== undefined) memberUpdate.plan_id = plan_id;
    if (join_date !== undefined) memberUpdate.joined_at = join_date;
    if (expiry_date !== undefined) memberUpdate.membership_end = expiry_date;
    if (date_of_birth !== undefined) memberUpdate.date_of_birth = date_of_birth;
    if (gender !== undefined) memberUpdate.gender = gender;
    if (height_cm !== undefined) memberUpdate.height_cm = height_cm;
    if (weight_kg !== undefined) memberUpdate.weight_kg = weight_kg;
    if (address !== undefined) memberUpdate.address = address;
    if (emergency_contact_name !== undefined) memberUpdate.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_phone !== undefined) memberUpdate.emergency_contact_phone = emergency_contact_phone;
    if (medical_conditions !== undefined) memberUpdate.medical_conditions = medical_conditions;
    if (fitness_goal !== undefined) memberUpdate.fitness_goal = fitness_goal;

    // Update members table (if there are fields to update)
    if (Object.keys(memberUpdate).length > 0) {
      const { error: memberErr } = await supabaseAdmin
        .from("members")
        .update(memberUpdate)
        .eq("id", req.params.id);

      if (memberErr) throw memberErr;
    }

    // Update users table (name, email, phone)
    const userUpdate = {};
    if (name !== undefined) userUpdate.name = name;
    if (email !== undefined) userUpdate.email = email;
    if (phone !== undefined) userUpdate.phone = phone;

    if (Object.keys(userUpdate).length > 0) {
      const { error: userErr } = await supabaseAdmin
        .from("users")
        .update(userUpdate)
        .eq("id", current.user_id);

      if (userErr) throw userErr;
    }

    // Fetch and return the updated member
    const { data: updated, error: updErr } = await supabaseAdmin
      .from("members")
      .select(MEMBER_SELECT)
      .eq("id", req.params.id)
      .single();

    if (updErr) throw updErr;

    res.json({ message: "Member updated.", member: updated });
  } catch (err) {
    console.error("UpdateMember error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * DELETE /api/members/:id
 * Admin only — deletes the member row AND the linked user account.
 * (CASCADE on user_id handles the member row automatically)
 */
async function deleteMember(req, res) {
  try {
    // Get the user_id before deleting
    const { data: member, error: fetchErr } = await supabaseAdmin
      .from("members")
      .select("user_id")
      .eq("id", req.params.id)
      .single();

    if (fetchErr || !member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Delete the user — CASCADE will remove the member row too
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", member.user_id);

    if (error) throw error;

    res.json({ message: "Member and user account deleted." });
  } catch (err) {
    console.error("DeleteMember error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};
