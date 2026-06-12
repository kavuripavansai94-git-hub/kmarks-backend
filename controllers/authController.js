const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabaseAdmin } = require("../config/supabase");

/**
 * POST /api/auth/register
 * Body: { name, email, password, phone?, role? }
 */
async function register(req, res) {
  try {
    const { name, email, password, phone, role = "member" } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required." });
    }

    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert({ name, email, password_hash, phone, role })
      .select("id, name, email, phone, role, created_at")
      .single();

    if (error) throw error;

    // Generate JWT — payload: { user_id, role, name }
    const token = jwt.sign(
      { user_id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful.",
      token,
      user,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // Fetch user by email
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone, role, password_hash, created_at")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Login DB query error:", error);
    }
    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Compare password using bcrypt.compare()
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT — payload: { user_id, role, name }
    const token = jwt.sign(
      { user_id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return token + user object (without password_hash)
    const { password_hash: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful.",
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * GET /api/auth/me
 * Returns the current user from the JWT (req.user.user_id).
 */
async function getMe(req, res) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone, role, created_at")
      .eq("id", req.user.user_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ user });
  } catch (err) {
    console.error("GetMe error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { register, login, getMe };
