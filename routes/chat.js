//  the RAG Chat and Tool Calling logic 

const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const genAI = require('../utils/geminiClient');

router.post('/', async (req, res) => {
    const { workspace_id, question } = req.body;
    if (!workspace_id || !question) {
        return res.status(400).json({ error: 'workspace_id and question are required' });

    }
    try {
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
        const result = await embeddingModel.embedContent(question);
        const questionEmbedding = result.embedding.values;

        const { data: matchedChunks, error: matchError } = await supabase.rpc('match_document_chunks', {
            query_embedding: questionEmbedding,
            match_threshold: 0.5,
            match_count: 5,
            p_workspace_id: workspace_id
        });
        if (matchError) {
            throw matchError;
        }
        let contextText = "";
        if (matchedChunks && matchedChunks.length > 0) {
            contextText = matchedChunks.map(chunk => chunk.content).join("\n\n");
        }
        else {
            contextText = "No relevent documents found in this workspace.";
        }

        // 1. Give Gemini BOTH Tools
        const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const chatSession = chatModel.startChat({
            tools: [{
                functionDeclarations: [
                    {
                        name: "save_task",
                        description: "Saves a task or reminder to the database.",
                        parameters: {
                            type: "OBJECT",
                            properties: { task_title: { type: "STRING" } },
                            required: ["task_title"]
                        }
                    },
                    {
                        name: "get_tasks",
                        description: "Retrieves all saved tasks for the current user's workspace."
                    }
                ]
            }]
        });

        const prompt = `
            You are a helpful Document Assistant.
            You MUST answer the user's question using ONLY the context provided below.
            If the context does not contain the answer, you MUST say "I cannot find the answer in the provided documents."
            Do not make up information.

            HOWEVER, if the user asks to save a task or view tasks, you are allowed to ignore the document context and MUST use your provided tools to fulfill their request.

            Context:
            ${contextText}

            User Question:
            ${question}
        `;


        // 2. Send the first message
        let chatResult = await chatSession.sendMessage(prompt);
        let functionCalls = chatResult.response.functionCalls();

        // 3. Check if the AI decided to use a tool
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            let apiResponse = {}; // We will put the database result in here

            if (call.name === "save_task") {
                const title = call.args.task_title;
                await supabase.from('tasks').insert([{ workspace_id: workspace_id, title: title }]);
                apiResponse = { status: "success", message: `Task '${title}' saved successfully.` };

            } else if (call.name === "get_tasks") {
                const { data } = await supabase.from('tasks').select('title, status').eq('workspace_id', workspace_id);
                apiResponse = { status: "success", tasks: data };
            }


            chatResult = await chatSession.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: apiResponse
                }
            }]);
        }


        const finalAnswer = chatResult.response.text();

        res.json({
            answer: finalAnswer,
            matchesFound: matchedChunks ? matchedChunks.length : 0
        });







    }
    catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Chat failed", detail: error.message });
    }
});

module.exports = router;
