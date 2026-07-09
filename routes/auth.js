const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

// Sign Up Route
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true // Instantly confirm so they can log in immediately
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'User created successfully', user: data.user });
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // CRITICAL: We create a temporary, isolated Supabase client just for this login check.
    // If we use the global singleton, signInWithPassword will downgrade the entire 
    // backend server's permissions from "service_role" (Admin) to "authenticated" (User),
    // which causes RLS violations on subsequent database queries for all users.
    const { createClient } = require('@supabase/supabase-js');
    const tempClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await tempClient.auth.signInWithPassword({
        email: email.trim(),
        password: password,
    });

    if (error) {
        return res.status(401).json({ error: error.message });
    }

    res.json({ message: 'Login successful', user: data.user });
});

module.exports = router;
