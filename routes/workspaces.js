// Workspace API routes 

const express = require('express');
const router = express.Router();

const supabase = require('../utils/supabaseClient');

//Creating new workspace
router.post('/', async (req, res) => {
    const { userid, name } = req.body;
    if (!userid || !name) {
        return res.status(400).json({ error: 'user_id and name are required' });
    }


    const { data, error } = await supabase.from('workspaces').insert([{ user_id: userid, name: name }]).select();
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Workspace created successfully", workspace: data[0] });
});

//getting all workspace for a specific user
router.get('/:userid', async (req, res) => {
    const { userid } = req.params;
    const { data, error } = await supabase.from('workspaces').select('*').eq('user_id', userid);
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ workspaces: data });

});

module.exports = router;