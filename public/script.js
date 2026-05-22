const state = {
    activeTab: 'description',
    currentReadme: '',
};

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            
            // Update buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            
            state.activeTab = tabName;
        });
    });

    // Event Listeners
    document.getElementById('generateBtn').addEventListener('click', generateReadme);
    document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
    document.getElementById('downloadBtn').addEventListener('click', downloadReadme);
});

async function generateReadme() {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.classList.remove('show');
    document.getElementById('output').innerHTML = '';
    document.getElementById('output').classList.remove('placeholder-text');

    let payload = { type: state.activeTab };
    let name = '';
    let desc = '';
    let tech = '';

    if (state.activeTab === 'description') {
        name = document.getElementById('projectName').value.trim();
        desc = document.getElementById('projectDesc').value.trim();
        tech = document.getElementById('technologies').value.trim();

        if (!name || !desc) {
            showError('Please fill in both project name and description');
            return;
        }

        payload = { ...payload, projectName: name, description: desc, technologies: tech };

    } else if (state.activeTab === 'github') {
        const url = document.getElementById('githubUrl').value.trim();
        if (!url) {
            showError('Please enter a GitHub repository URL');
            return;
        }

        if (!url.includes('github.com')) {
            showError('Please enter a valid GitHub URL');
            return;
        }

        payload = { ...payload, githubUrl: url };

    } else if (state.activeTab === 'files') {
        const files = document.getElementById('fileInput').files;
        name = document.getElementById('uploadProjectName').value.trim();
        desc = document.getElementById('uploadDesc').value.trim();

        if (files.length === 0 || !name) {
            showError('Please upload files and enter a project name');
            return;
        }

        try {
            payload.files = await readUploadedFiles(files);
            payload.projectName = name;
            payload.description = desc;
        } catch (e) {
            showError('Failed to read uploaded files');
            return;
        }
    }

    await callAIAPI(payload);
}

async function readUploadedFiles(files) {
    const arr = [];
    for (let file of files) {
        try {
            const text = await file.text();
            arr.push({ name: file.name, content: text.substring(0, 5000) });
        } catch (e) {
            arr.push({ name: file.name, content: '[Binary or unreadable file]' });
        }
    }
    return arr;
}

async function callAIAPI(payload) {
    const loading = document.getElementById('loading');
    const output = document.getElementById('output');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    loading.classList.add('active');
    copyBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    output.innerHTML = ''; // clear previous output

    try {
        const resp = await fetch('/api/generate-readme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || resp.statusText || 'Generation failed');
        }

        const data = await resp.json();
        if (data && data.readme) {
            state.currentReadme = data.readme;
            displayReadme(data.readme);
            copyBtn.style.display = 'block';
            downloadBtn.style.display = 'block';
        } else {
            throw new Error('No README returned from server');
        }
    } catch (error) {
        showError('Failed to generate README. ' + (error.message || 'Please try again.'));
        console.error(error);
        
        // Restore placeholder if it failed completely
        if (!state.currentReadme) {
            output.innerHTML = '<i class="fas fa-file-alt"></i><p>Your generated README will appear here</p>';
            output.classList.add('placeholder-text');
        } else {
            displayReadme(state.currentReadme);
            copyBtn.style.display = 'block';
            downloadBtn.style.display = 'block';
        }
    } finally {
        loading.classList.remove('active');
    }
}

function displayReadme(markdown) {
    const output = document.getElementById('output');
    // Using marked library loaded via CDN in index.html
    const html = marked.parse(markdown);
    output.innerHTML = `<div class="readme-preview">${html}</div>`;
    output.classList.remove('placeholder-text');
}

function copyToClipboard() {
    navigator.clipboard.writeText(state.currentReadme).then(() => {
        const btn = document.getElementById('copyBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'rgba(16, 185, 129, 0.8)'; // green tint
        btn.style.borderColor = 'rgba(16, 185, 129, 1)';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.style.borderColor = '';
        }, 2000);
    });
}

async function downloadReadme() {
    if (!state.currentReadme) return;
    
    try {
        if (window.showSaveFilePicker) {
            // Modern browser API to ask for location
            const handle = await window.showSaveFilePicker({
                suggestedName: 'README.md',
                types: [{
                    description: 'Markdown File',
                    accept: { 'text/markdown': ['.md'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(state.currentReadme);
            await writable.close();
        } else {
            // Fallback for older browsers
            const blob = new Blob([state.currentReadme], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'README.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            showError('Failed to download file');
            console.error(err);
        }
    }
}

function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorMsg.classList.add('show');
    
    // Auto-hide error
    setTimeout(() => {
        errorMsg.classList.remove('show');
    }, 5000);
}
