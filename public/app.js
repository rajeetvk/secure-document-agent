// DOM Elements
const authView = document.getElementById('auth-view');
const switcherView = document.getElementById('switcher-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const authStatus = document.getElementById('auth-status');
const navWorkspaceName = document.getElementById('nav-workspace-name');
const logoutBtn = document.getElementById('logoutBtn');
const switchWsBtn = document.getElementById('switchWsBtn');
const logoutFromSwitcher = document.getElementById('logoutFromSwitcher');

const workspaceList = document.getElementById('workspace-list');
const createWorkspaceForm = document.getElementById('create-workspace-form');

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('upload-status');
const chunkCount = document.getElementById('chunkCount');
const docCount = document.getElementById('docCount');
const docList = document.getElementById('doc-list');

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chatInput');
const chatHistory = document.getElementById('chatHistory');

const toggleAuth = document.getElementById('toggleAuth');
const toggleText = document.getElementById('toggleText');
const btnText = document.getElementById('btnText');

// State
let isLoginMode = true;
let currentUserId = localStorage.getItem('user_id') || null;
let currentWorkspaceId = localStorage.getItem('workspace_id') || null;
let currentWorkspaceName = localStorage.getItem('workspace_name') || null;

// Initialization
function init() {
    if (currentUserId && currentWorkspaceId) {
        showDashboard();
    } else if (currentUserId) {
        showSwitcher();
    }
}

async function showSwitcher() {
    authView.classList.remove('active');
    dashboardView.classList.remove('active');
    switcherView.classList.add('active');
    history.pushState({ view: 'switcher' }, '', '#workspaces');
    
    // Fetch user's workspaces
    workspaceList.innerHTML = '<div class="status-msg status-loading">Loading workspaces...</div>';
    try {
        const res = await fetch(`/api/workspaces/${currentUserId}`);
        const data = await res.json();
        if (data.workspaces && data.workspaces.length > 0) {
            workspaceList.innerHTML = '';
            data.workspaces.forEach(ws => {
                const btn = document.createElement('button');
                btn.className = 'btn-primary';
                btn.style.background = 'rgba(15, 23, 42, 0.6)';
                btn.style.justifyContent = 'space-between';
                btn.innerHTML = `<span>${ws.name}</span> <i class="fa-solid fa-chevron-right"></i>`;
                btn.onclick = () => {
                    currentWorkspaceId = ws.id;
                    currentWorkspaceName = ws.name;
                    localStorage.setItem('workspace_id', ws.id);
                    localStorage.setItem('workspace_name', ws.name);
                    showDashboard();
                };
                workspaceList.appendChild(btn);
            });
        } else {
            workspaceList.innerHTML = '<div class="status-msg">No workspaces found. Create one below!</div>';
        }
    } catch (err) {
        workspaceList.innerHTML = `<div class="status-error">Failed to load workspaces.</div>`;
    }
}

function showDashboard() {
    authView.classList.remove('active');
    switcherView.classList.remove('active');
    dashboardView.classList.add('active');
    navWorkspaceName.textContent = currentWorkspaceName;
    history.pushState({ view: 'dashboard' }, '', '#dashboard');
    
    // Clear residual upload state when entering a new workspace
    uploadStatus.textContent = 'Upload PDF documents to train your agent.';
    uploadStatus.className = 'status-msg';
    chunkCount.textContent = '0';
    
    refreshDocumentList();
    loadChatHistory();
}

async function refreshDocumentList() {
    try {
        const res = await fetch(`/api/documents/${currentWorkspaceId}`);
        const data = await res.json();
        if (data.documents) {
            docCount.textContent = data.documents.length;
            docList.innerHTML = data.documents.map(doc => 
                `<div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${doc.filename}">${doc.filename}</span>
                </div>`
            ).join('');
        }
        
        // Also fetch Tool-Call Task Log
        const taskRes = await fetch(`/api/workspaces/tasks/${currentWorkspaceId}`);
        const taskData = await taskRes.json();
        const taskList = document.getElementById('task-list');
        if (taskData.tasks && taskData.tasks.length > 0) {
            taskList.innerHTML = taskData.tasks.map(task => 
                `<div style="display: flex; flex-direction: column; gap: 4px; background: rgba(16, 185, 129, 0.05); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6ee7b7; font-weight: 600;">save_task()</span>
                        <span style="color: var(--text-muted); font-size: 0.75rem;">${new Date(task.created_at).toLocaleTimeString()}</span>
                    </div>
                    <span style="color: var(--text-main);">${task.title}</span>
                </div>`
            ).join('');
        } else {
            taskList.innerHTML = '<div class="status-msg">No tools invoked yet.</div>';
        }

    } catch (err) {
        console.error("Failed to load dashboard data", err);
    }
}

function showAuth() {
    dashboardView.classList.remove('active');
    switcherView.classList.remove('active');
    authView.classList.add('active');
    localStorage.clear();
    currentUserId = null;
    currentWorkspaceId = null;
    history.pushState({ view: 'auth' }, '', '#login');
}

// Handle Browser Back Button
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view === 'dashboard' && currentWorkspaceId) {
        showDashboard();
    } else if (e.state && e.state.view === 'switcher' && currentUserId) {
        showSwitcher();
    } else {
        showAuth();
    }
});

// Event Listeners
toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        toggleText.textContent = "Don't have an account?";
        toggleAuth.textContent = "Sign Up";
        btnText.textContent = "Sign In & Enter";
    } else {
        toggleText.textContent = "Already have an account?";
        toggleAuth.textContent = "Sign In";
        btnText.textContent = "Create Account";
    }
});

// 1. Auth Flow
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    btn.disabled = true;
    authStatus.textContent = '';

    try {
        const authEndpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup';
        const authRes = await fetch(authEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const authData = await authRes.json();
        if (!authRes.ok) throw new Error(authData.error || 'Authentication failed');
        
        if (!isLoginMode) {
            authStatus.textContent = 'Account created successfully! Please sign in.';
            authStatus.className = 'status-msg status-success';
            isLoginMode = true;
            toggleText.textContent = "Don't have an account?";
            toggleAuth.textContent = "Sign Up";
            btnText.textContent = "Sign In";
            document.getElementById('password').value = ''; 
            btn.innerHTML = `<span id="btnText">Sign In</span><i class="fa-solid fa-arrow-right"></i>`;
            btn.disabled = false;
            return; 
        }

        currentUserId = authData.user.id;
        localStorage.setItem('user_id', currentUserId);
        showSwitcher();
    } catch (err) {
        authStatus.textContent = err.message;
        authStatus.className = 'status-msg status-error';
        btn.innerHTML = `<span id="btnText">${isLoginMode ? 'Sign In' : 'Create Account'}</span><i class="fa-solid fa-arrow-right"></i>`;
        btn.disabled = false;
    }
});

// 2. Workspace Creation
createWorkspaceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newWorkspaceName').value;
    const btn = document.getElementById('createWsBtn');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    btn.disabled = true;

    try {
        const res = await fetch('/api/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userid: currentUserId, name: name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create workspace');
        
        currentWorkspaceId = data.workspace.id;
        currentWorkspaceName = data.workspace.name;
        localStorage.setItem('workspace_id', currentWorkspaceId);
        localStorage.setItem('workspace_name', currentWorkspaceName);
        showDashboard();
    } catch (err) {
        alert(err.message);
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        btn.disabled = false;
    }
});

logoutBtn.addEventListener('click', showAuth);
logoutFromSwitcher.addEventListener('click', showAuth);
switchWsBtn.addEventListener('click', () => {
    localStorage.removeItem('workspace_id');
    localStorage.removeItem('workspace_name');
    currentWorkspaceId = null;
    showSwitcher();
});

// 2. Upload Flow
uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFileUpload(e.target.files[0]);
    }
});

async function handleFileUpload(file) {
    if (file.type !== 'application/pdf') {
        uploadStatus.textContent = 'Please upload a PDF file.';
        uploadStatus.className = 'status-msg status-error';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', currentWorkspaceId);

    uploadStatus.textContent = 'Uploading and chunking document...';
    uploadStatus.className = 'status-msg status-loading';
    uploadZone.style.pointerEvents = 'none';

    try {
        const res = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        
        uploadStatus.textContent = `Success! Generated ${data.chunksCreated} chunks.`;
        uploadStatus.className = 'status-msg status-success';
        
        const currentChunks = parseInt(chunkCount.textContent) || 0;
        chunkCount.textContent = currentChunks + data.chunksCreated;
        
        refreshDocumentList();
        
    } catch (err) {
        uploadStatus.textContent = err.message;
        uploadStatus.className = 'status-msg status-error';
    } finally {
        uploadZone.style.pointerEvents = 'auto';
        fileInput.value = ''; // reset
    }
}

function saveChatHistory() {
    const messages = [];
    document.querySelectorAll('.chat-history .message:not(#loading-msg)').forEach(msgDiv => {
        const isUser = msgDiv.classList.contains('user-msg');
        const bubble = msgDiv.querySelector('.bubble').innerHTML;
        // Skip the initial welcome message
        if (!isUser && bubble.includes('Workspace initialized')) return;
        messages.push({ sender: isUser ? 'user' : 'system', html: bubble });
    });
    localStorage.setItem(`chat_${currentWorkspaceId}`, JSON.stringify(messages));
}

function loadChatHistory() {
    // Clear current history (keep only the welcome message)
    const welcomeMsg = chatHistory.querySelector('.system-msg').outerHTML;
    chatHistory.innerHTML = welcomeMsg;
    
    const saved = localStorage.getItem(`chat_${currentWorkspaceId}`);
    if (saved) {
        const messages = JSON.parse(saved);
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.sender === 'user' ? 'user-msg' : 'system-msg'}`;
            const icon = msg.sender === 'user' ? 'fa-user' : 'fa-bolt-lightning';
            div.innerHTML = `
                <div class="avatar"><i class="fa-solid ${icon}"></i></div>
                <div class="bubble">${msg.html}</div>
            `;
            chatHistory.appendChild(div);
        });
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}

// 3. Chat Flow
function addMessage(text, sender, isTool = false) {
    const div = document.createElement('div');
    div.className = `message ${sender === 'user' ? 'user-msg' : 'system-msg'}`;
    
    const icon = sender === 'user' ? 'fa-user' : 'fa-bolt-lightning';
    let toolHtml = '';
    
    // Auto-detect if the AI response implies it saved or fetched a task (primitive check for tool visual)
    if (sender === 'system' && (text.toLowerCase().includes('task') || text.toLowerCase().includes('remind'))) {
        toolHtml = `<br><span class="tool-badge"><i class="fa-solid fa-microchip"></i> Agent Tool Invoked</span>`;
    }

    // Parse Markdown to HTML for beautiful bullet points and bold text
    // Only parse if it's new text, not already HTML from localStorage
    const parsedText = (text.includes('<br>') || text.includes('<ul>')) ? text : (typeof marked !== 'undefined' ? marked.parse(text) : text.replace(/\n/g, '<br>'));

    div.innerHTML = `
        <div class="avatar"><i class="fa-solid ${icon}"></i></div>
        <div class="bubble">
            ${parsedText}
            ${toolHtml}
        </div>
    `;
    
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    saveChatHistory();
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user');
    chatInput.value = '';
    
    // Add loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message system-msg';
    loadingDiv.id = 'loading-msg';
    loadingDiv.innerHTML = `
        <div class="avatar"><i class="fa-solid fa-bolt-lightning fa-fade"></i></div>
        <div class="bubble"><i class="fa-solid fa-ellipsis fa-fade"></i> Processing...</div>
    `;
    chatHistory.appendChild(loadingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workspace_id: currentWorkspaceId,
                question: text
            })
        });
        
        const data = await res.json();
        document.getElementById('loading-msg').remove();
        
        if (!res.ok) {
            addMessage(`Error: ${data.error || 'Failed to get answer'}`, 'system');
        } else {
            addMessage(data.answer, 'system');
        }
        
        // Refresh to instantly show any new tasks that Gemini might have saved via tool calls
        refreshDocumentList();
        
    } catch (err) {
        document.getElementById('loading-msg').remove();
        addMessage(`Network Error: ${err.message}`, 'system');
        
        // UX Requirement: Restore the user's question to the input box so work is not lost!
        chatInput.value = text;
    } finally {
        sendBtn.disabled = false;
        chatInput.focus();
    }
});

init();
