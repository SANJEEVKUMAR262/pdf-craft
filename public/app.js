const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const fileList = document.getElementById('fileList');
const emptyMessage = document.getElementById('emptyMessage');
const processBtn = document.getElementById('processBtn');

let selectedFiles = [];

dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelection);

dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-indigo-500'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-indigo-500'));
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-indigo-500');
    if (e.dataTransfer.files.length > 0) {
        handleFileSelection({ target: { files: e.dataTransfer.files } });
    }
});

function handleFileSelection(e) {
    const files = Array.from(e.target.files).filter(file => file.type === "application/pdf");
    
    files.forEach(file => {
        selectedFiles.push({
            fileObj: file,
            id: Date.now() + Math.random().toString(36).substr(2, 5)
        });
    });
    
    renderQueue();
}

window.removeFile = function(id) {
    selectedFiles = selectedFiles.filter(item => item.id !== id);
    renderQueue();
}

function renderQueue() {
    fileList.innerHTML = '';
    
    if (selectedFiles.length === 0) {
        emptyMessage.classList.remove('hidden');
        fileList.appendChild(emptyMessage);
        processBtn.classList.add('hidden');
        return;
    }
    
    emptyMessage.classList.add('hidden');
    processBtn.classList.remove('hidden');

    selectedFiles.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = "flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl space-y-3 md:space-y-0";
        row.innerHTML = `
            <div class="flex items-center space-x-3 overflow-hidden">
                <span class="bg-indigo-900 text-indigo-300 font-mono text-xs px-2 py-1 rounded">#${index + 1}</span>
                <p class="text-sm font-medium text-slate-200 truncate max-w-xs">${item.fileObj.name}</p>
                <p class="text-xs text-slate-500">(${(item.fileObj.size / (1024 * 1024)).toFixed(2)} MB)</p>
            </div>
            <div class="flex items-center space-x-2">
                <input type="text" id="range-${item.id}" placeholder="e.g., 1-5, 20-50, 60-170" 
                       class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 w-48 placeholder-slate-600" />
                <button onclick="removeFile('${item.id}')" class="text-rose-400 hover:text-rose-300 text-sm font-semibold px-2 py-1.5">
                    Remove
                </button>
            </div>
        `;
        fileList.appendChild(row);
    });
}

processBtn.addEventListener('click', async () => {
    processBtn.disabled = true;
    processBtn.innerText = "Processing Document...";

    const formData = new FormData();
    const configs = [];

    selectedFiles.forEach(item => {
        formData.append('pdfs', item.fileObj);
        const rangeValue = document.getElementById(`range-${item.id}`).value;
        configs.push({ range: rangeValue });
    });

    formData.append('configs', JSON.stringify(configs));

    try {
        const response = await fetch('/api/process-pdf', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Compilation failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crafted_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error(error);
        alert("An error occurred during compilation. Please double check your page range formats.");
    } finally {
        processBtn.disabled = false;
        processBtn.innerText = "Compile & Download PDF";
    }
});