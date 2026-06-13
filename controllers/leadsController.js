const { supabaseAdmin } = require('../config/supabase');

exports.getAllLeads = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ leads: data });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createLead = async (req, res) => {
  try {
    const { name, phone, source, status, notes, follow_up_date } = req.body;

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert([{
        name,
        phone,
        source: source || 'Walk-in',
        status: status || 'New',
        notes: notes || null,
        follow_up_date: follow_up_date || null
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ lead: data });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, source, status, notes, follow_up_date } = req.body;

    const updatePayload = {
      name,
      phone,
      source,
      status,
      notes,
      follow_up_date,
      updated_at: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ lead: data });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: error.message });
  }
};
