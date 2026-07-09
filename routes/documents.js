//  Document Upload and Chunking logic 

const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const supabase = require('../utils/supabaseClient');
const genAI = require('../utils/geminiClient');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
    const { workspace_id } = req.body;
    const file = req.file;
    if (!workspace_id || !file) {
        return res.status(400).json({ error: 'workspace id and file are required' });

    }
    try {
        const pdfData = await pdfParse(file.buffer);
        const text = pdfData.text;

        // IDEMPOTENCY: If the document already exists, delete it first to prevent duplicate chunks.
        // Thanks to 'ON DELETE CASCADE' in our schema, this automatically wipes all its old vector chunks too!
        await supabase.from('documents').delete().eq('workspace_id', workspace_id).eq('filename', file.originalname);

        const { data: docData, error: docError } = await supabase.from('documents').insert([{
            workspace_id: workspace_id, filename: file.originalname
        }]).select();
        if (docError) {
            throw docError;
        }

        const chunkSize = 1000;
        const overlap = 200;
        const chunks = [];
        for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

        for (const chunk of chunks) {
            const result = await embeddingModel.embedContent(chunk);
            const embeddingNumbers = result.embedding.values;

            await supabase.from('document_chunks').insert([{
                document_id: docData[0].id,
                workspace_id: workspace_id,
                content: chunk,
                embedding: embeddingNumbers
            }]);
        }
        res.json({
            message: "File uploaded,chunked,and safely isolated in the database!",
            document: docData[0],
            chunksCreated: chunks.length
        });


    }
    catch (error) {
        console.log("Upload Error:", error);
        res.status(500).json({ error: "File upload failed", detail: error.message });
    }

});

// Get all documents for a workspace
router.get('/:workspace_id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('workspace_id', req.params.workspace_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ documents: data });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch documents", detail: error.message });
    }
});module.exports = router;

// configure the storage 
