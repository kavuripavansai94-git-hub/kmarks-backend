const { supabase } = require('../config/supabase');

// Helper to generate recurring expenses for the current month
const checkAndGenerateRecurringExpenses = async () => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // 1. Get all base recurring expenses (we consider the earliest instance of each recurring expense as the template)
    const { data: recurringExpenses, error: recErr } = await supabase
      .from('expenses')
      .select('*')
      .eq('is_recurring', true)
      .order('due_date', { ascending: true });

    if (recErr || !recurringExpenses) return;

    // We only want to duplicate each unique recurring expense once per month.
    // A simple way is to use the description and amount as a unique key.
    const templates = new Map();
    recurringExpenses.forEach(exp => {
      const key = `${exp.description}_${exp.amount}_${exp.category}_${exp.branch_id}`;
      if (!templates.has(key)) {
        templates.set(key, exp);
      }
    });

    // 2. Get all expenses for the current month
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

    const { data: currentMonthExpenses, error: currErr } = await supabase
      .from('expenses')
      .select('*')
      .gte('due_date', startOfMonth)
      .lte('due_date', endOfMonth);

    if (currErr) return;

    // 3. For each template, check if an instance exists this month
    const newExpenses = [];
    templates.forEach(template => {
      const existsThisMonth = currentMonthExpenses.some(curr => 
        curr.description === template.description &&
        curr.amount === template.amount &&
        curr.category === template.category &&
        curr.is_recurring === true
      );

      if (!existsThisMonth) {
        // Create a new expense for this month
        const originalDate = new Date(template.due_date);
        let newDate = new Date(currentYear, currentMonth, originalDate.getDate());
        
        // Handle edge cases like Feb 30th -> March 2nd. We want to cap to end of month.
        if (newDate.getMonth() !== currentMonth) {
           newDate = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
        }

        newExpenses.push({
          branch_id: template.branch_id,
          category: template.category,
          description: template.description,
          amount: template.amount,
          status: 'PENDING',
          due_date: newDate.toISOString().split('T')[0],
          is_recurring: true
        });
      }
    });

    if (newExpenses.length > 0) {
      await supabase.from('expenses').insert(newExpenses);
    }
  } catch (err) {
    console.error('Error generating recurring expenses:', err);
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    // Optionally trigger the recurring check (lazy evaluation)
    await checkAndGenerateRecurringExpenses();

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        branches ( name )
      `)
      .order('due_date', { ascending: false });

    if (error) throw error;
    
    // Transform data to include branchName at the top level for the frontend
    const formattedData = data.map(exp => ({
      ...exp,
      branchName: exp.branches?.name || 'Unassigned'
    }));

    res.json({ expenses: formattedData });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { branch_id, category, description, amount, status, due_date, paid_date, payment_method, is_recurring } = req.body;

    const newExpense = {
      branch_id: branch_id || null,
      category: category || 'Other',
      description,
      amount,
      status: status || 'PENDING',
      due_date,
      paid_date: paid_date || null,
      payment_method: payment_method || null,
      is_recurring: is_recurring || false
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ expense: data });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id, category, description, amount, status, due_date, paid_date, payment_method, is_recurring } = req.body;

    const updatePayload = {
      branch_id: branch_id || null,
      category,
      description,
      amount,
      status,
      due_date,
      paid_date: paid_date || null,
      payment_method: payment_method || null,
      is_recurring: is_recurring,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ expense: data });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: error.message });
  }
};
