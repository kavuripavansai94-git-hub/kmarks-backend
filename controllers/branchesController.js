const { supabaseAdmin } = require("../config/supabase");

async function getAllBranches(req, res) {
  try {
    // We fetch branches, members, and recent payments to calculate utilization and revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [branchesRes, membersRes, paymentsRes] = await Promise.all([
      supabaseAdmin
        .from("branches")
        .select("*, manager:users(id, name)")
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("members")
        .select("id, branch_id"),
      supabaseAdmin
        .from("payments")
        .select("amount, status, member_id")
        .gte("created_at", thirtyDaysAgo.toISOString())
    ]);

    if (branchesRes.error) throw branchesRes.error;
    
    const allMembers = membersRes.data || [];
    const allPayments = paymentsRes.data || [];

    const branches = branchesRes.data.map(b => {
      // Find members for this branch
      const branchMembers = allMembers.filter(m => m.branch_id === b.id);
      const memberCount = branchMembers.length;
      
      // Calculate revenue (assuming status is completed/paid, but for safety we'll just sum all non-failed/pending if not strictly typed, actually let's just sum all for the demo or check status === 'completed')
      // Let's sum payments where status is 'completed' or 'paid'
      const branchMemberIds = new Set(branchMembers.map(m => m.id));
      const branchPayments = allPayments.filter(p => 
        branchMemberIds.has(p.member_id) && 
        (p.status === 'completed' || p.status === 'paid' || p.status === 'SUCCESS')
      );
      const monthlyRevenue = branchPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        ...b,
        manager_name: b.manager ? b.manager.name : 'Unassigned',
        manager_id: b.manager ? b.manager.id : null,
        member_count: memberCount,
        monthly_revenue: monthlyRevenue
      };
    });

    res.json({ branches });
  } catch (err) {
    console.error("GetAllBranches error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function createBranch(req, res) {
  try {
    const { name, location, status, manager_id, max_capacity, contact_phone, contact_email, address } = req.body;
    
    const payload = {
      name,
      location,
      status: status || 'ACTIVE',
      manager_id: manager_id || null,
      max_capacity: max_capacity ? parseInt(max_capacity) : 500,
      contact_phone,
      contact_email,
      address
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
    const { name, location, status, manager_id, max_capacity, contact_phone, contact_email, address } = req.body;

    const payload = {
      name,
      location,
      status,
      manager_id: manager_id || null,
      max_capacity: max_capacity ? parseInt(max_capacity) : undefined,
      contact_phone,
      contact_email,
      address,
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
