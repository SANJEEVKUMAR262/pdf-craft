document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileDetails = document.getElementById('fileDetails');
    const addRangeBtn = document.getElementById('addRangeBtn');
    const rangesContainer = document.getElementById('rangesContainer');
    const form = document.getElementById('uploadForm');

    let selectedFile = null;

    // Trigger explicit browsing window on wrapper click
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files[0]);
    });

    // Drag and drop event orchestration mapping
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        handleFileSelection(dt.files[0]);
    });

    function handleFileSelection(file) {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            fileDetails.innerHTML = `Selected: <span class="text-green-400 font-semibold">${file.name}</span> (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        } else {
            alert('Invalid file structure. Please submit a valid PDF.');
        }
    }

    // Dynamic row generation injection pipeline block
    addRangeBtn.addEventListener('click', () => {
        const rowWrapper = document.createElement('div');
        rowWrapper.className = 'flex items-center space-x-2 transform scale-95 opacity-0 transition-all duration-200 ease-out';
        
        rowWrapper.innerHTML = `
            <input type="text" name="rangeInput" required placeholder="e.g. 5-8" 
                   class="flex-1 bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 outline-none border border-gray-600 focus:border-blue-500 transition">
            <button type="button" class="remove-row-btn text-red-400 hover:text-red-300 px-2 text-xl font-bold transition focus:outline-none">✕</button>
        `;
        
        rangesContainer.appendChild(rowWrapper);
        
        // Trigger micro-animation entry sequence frames
        setTimeout(() => {
            rowWrapper.classList.remove('scale-95', 'opacity-0');
        }, 10);

        rowWrapper.querySelector('.remove-row-btn').addEventListener('click', () => {
            rowWrapper.classList.add('scale-95', 'opacity-0');
            setTimeout(() => rowWrapper.remove(), 200);
        });
    });

    // Form pipeline submission tracking architecture 
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            alert('Please select or drop a valid source PDF document first.');
            return;
        }

        const formData = new FormData();
        formData.append('pdfFile', selectedFile);

        // Collect string values across all dynamic text rows
        const rangeInputs = document.querySelectorAll('input[name="rangeInput"]');
        let configurationAdded = false;

        rangeInputs.forEach(input => {
            const val = input.value.trim();
            if (val) {
                formData.append('ranges', val);
                configurationAdded = true;
            }
        });

        if (!configurationAdded) {
            alert('Please supply at least one parsing range value configuration entry.');
            return;
        }

        try {
            const response = await fetch('/api/splice', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errPayload = await response.json();
                throw new Error(errPayload.error || 'Server pipeline compiling error.');
            }

            // Capture raw output archive payload blob
            const zipBlob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(zipBlob);
            
            const linkNode = document.createElement('a');
            linkNode.href = downloadUrl;
            linkNode.download = 'crafted_pdfs_package.zip';
            
            document.body.appendChild(linkNode);
            linkNode.click();
            
            // Garbage collection stream freeing operations
            linkNode.remove();
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            alert(error.message);
        }
    });
});