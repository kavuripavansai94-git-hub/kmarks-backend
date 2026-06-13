const bcrypt = require("bcryptjs");
const { supabaseAdmin } = require("../config/supabase");

// Select string — trainers joined with their user data
const TRAINER_SELECT = `
  id,
  user_id,
  branch_id,
  specialization,
  experience_years,
  bio,
  certifications,
  available_from,
  available_to,
  max_clients,
  per_session_fee,
  created_at,
  users:user_id ( id, name, email, phone, role )
`;

/**
 * GET /api/trainers
 * Admin only — returns all trainers.
 */
async function getAllTrainers(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("trainers")
      .select(TRAINER_SELECT)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ trainers: data });
  } catch (err) {
    console.error("GetAllTrainers error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * GET /api/trainers/:id
 * Admin only — returns one trainer by ID.
 */
async function getTrainerById(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("trainers")
      .select(TRAINER_SELECT)
      .eq("id", req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.json({ trainer: data });
  } catch (err) {
    console.error("GetTrainerById error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/trainers
 * Admin only — creates a user account (role: 'trainer', password: 'kmarks123')
 * and a corresponding row in the trainers table.
 *
 * Body: { name, email, phone, specialty, joined_date }
 */
async function createTrainer(req, res) {
  try {
    const { name, email, phone, specialty, branch_id, joined_date } = req.body;

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
      .insert({
        name,
        email,
        phone,
        password_hash,
        role: "trainer",
        created_at: joined_date || new Date().toISOString(),
      })
      .select("id, name, email, phone, role, created_at")
      .single();

    if (userError) throw userError;

    // 2. Create trainer profile
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from("trainers")
      .insert({
        user_id: user.id,
        specialization: specialty || null,
        branch_id: branch_id || null,
      })
      .select()
      .single();

    if (trainerError) {
      // Rollback: delete the user we just created
      await supabaseAdmin.from("users").delete().eq("id", user.id);
      throw trainerError;
    }

    res.status(201).json({
      message: "Trainer created successfully.",
      trainer: { ...trainer, user },
    });
  } catch (err) {
    console.error("CreateTrainer error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * PUT /api/trainers/:id
 * Admin only — updates trainer profile and optionally the user record.
 *
 * Body: { name?, email?, phone?, specialty?, experience_years?, bio?,
 *         certifications?, available_from?, available_to?,
 *         max_clients?, per_session_fee? }
 */
async function updateTrainer(req, res) {
  try {
    const {
      name,
      email,
      phone,
      specialty,
      branch_id,
      experience_years,
      bio,
      certifications,
      available_from,
      available_to,
      max_clients,
      per_session_fee,
    } = req.body;

    // Fetch current trainer to get user_id
    const { data: current, error: fetchError } = await supabaseAdmin
      .from("trainers")
      .select("user_id")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !current) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    // Build trainer update payload
    const trainerUpdate = {};
    if (specialty !== undefined) trainerUpdate.specialization = specialty;
    if (branch_id !== undefined) trainerUpdate.branch_id = branch_id;
    if (experience_years !== undefined) trainerUpdate.experience_years = experience_years;
    if (bio !== undefined) trainerUpdate.bio = bio;
    if (certifications !== undefined) trainerUpdate.certifications = certifications;
    if (available_from !== undefined) trainerUpdate.available_from = available_from;
    if (available_to !== undefined) trainerUpdate.available_to = available_to;
    if (max_clients !== undefined) trainerUpdate.max_clients = max_clients;
    if (per_session_fee !== undefined) trainerUpdate.per_session_fee = per_session_fee;

    if (Object.keys(trainerUpdate).length > 0) {
      const { error: trainerErr } = await supabaseAdmin
        .from("trainers")
        .update(trainerUpdate)
        .eq("id", req.params.id);

      if (trainerErr) throw trainerErr;
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

    // Fetch and return the updated trainer
    const { data: updated, error: updErr } = await supabaseAdmin
      .from("trainers")
      .select(TRAINER_SELECT)
      .eq("id", req.params.id)
      .single();

    if (updErr) throw updErr;

    res.json({ message: "Trainer updated.", trainer: updated });
  } catch (err) {
    console.error("UpdateTrainer error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * DELETE /api/trainers/:id
 * Admin only — deletes the trainer row AND the linked user account.
 * (CASCADE on user_id handles the trainer row automatically)
 */
async function deleteTrainer(req, res) {
  try {
    const { data: trainer, error: fetchErr } = await supabaseAdmin
      .from("trainers")
      .select("user_id")
      .eq("id", req.params.id)
      .single();

    if (fetchErr || !trainer) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    // Delete the user — CASCADE removes the trainer row too
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", trainer.user_id);

    if (error) throw error;

    res.json({ message: "Trainer and user account deleted." });
  } catch (err) {
    console.error("DeleteTrainer error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
};
