document.addEventListener('DOMContentLoaded', () => {

    // ── TAB SWITCHING ────────────────────────────────────────────────────────
    window.switchTab = function (tab) {
        document.getElementById('panel-split').classList.toggle('hidden', tab !== 'split');
        document.getElementById('panel-merge').classList.toggle('hidden', tab !== 'merge');
        document.getElementById('tab-split').className =
            (tab === 'split' ? 'tab-active' : 'tab-inactive') +
            ' px-6 py-2.5 text-sm font-semibold transition focus:outline-none';
        document.getElementById('tab-merge').className =
            (tab === 'merge' ? 'tab-active' : 'tab-inactive') +
            ' px-6 py-2.5 text-sm font-semibold transition focus:outline-none';
    };

    // ── SPLIT LOGIC ──────────────────────────────────────────────────────────
    const splitDropZone   = document.getElementById('splitDropZone');
    const splitFileInput  = document.getElementById('splitFileInput');
    const splitFileDetails= document.getElementById('splitFileDetails');
    const addRangeBtn     = document.getElementById('addRangeBtn');
    const rangesContainer = document.getElementById('rangesContainer');
    const splitForm       = document.getElementById('splitForm');
    const splitSubmitBtn  = document.getElementById('splitSubmitBtn');
    const splitBtnText    = document.getElementById('splitBtnText');
    const splitSpinner    = document.getElementById('splitSpinner');

    let selectedSplitFile = null;

    splitDropZone.addEventListener('click', () => splitFileInput.click());
    splitFileInput.addEventListener('change', (e) => handleSplitFile(e.target.files[0]));

    ['dragenter', 'dragover'].forEach(ev => {
        splitDropZone.addEventListener(ev, (e) => { e.preventDefault(); splitDropZone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach(ev => {
        splitDropZone.addEventListener(ev, (e) => { e.preventDefault(); splitDropZone.classList.remove('drag-over'); });
    });
    splitDropZone.addEventListener('drop', (e) => handleSplitFile(e.dataTransfer.files[0]));

    function handleSplitFile(file) {
        if (file && file.type === 'application/pdf') {
            selectedSplitFile = file;
            splitFileDetails.innerHTML = `Selected: <span class="text-green-400 font-semibold">${file.name}</span> (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        } else {
            alert('Invalid file. Please submit a valid PDF.');
        }
    }

    addRangeBtn.addEventListener('click', () => {
        const rowWrapper = document.createElement('div');
        rowWrapper.className = 'flex items-center space-x-2 transform scale-95 opacity-0 transition-all duration-200 ease-out';
        rowWrapper.innerHTML = `
            <input type="text" name="rangeInput" required placeholder="e.g. 5-8"
                   class="flex-1 bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 outline-none border border-gray-600 focus:border-blue-500 transition">
            <button type="button" class="remove-row-btn text-red-400 hover:text-red-300 px-2 text-xl font-bold transition focus:outline-none">✕</button>
        `;
        rangesContainer.appendChild(rowWrapper);
        setTimeout(() => rowWrapper.classList.remove('scale-95', 'opacity-0'), 10);
        rowWrapper.querySelector('.remove-row-btn').addEventListener('click', () => {
            rowWrapper.classList.add('scale-95', 'opacity-0');
            setTimeout(() => rowWrapper.remove(), 200);
        });
    });

    splitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedSplitFile) { alert('Please select a PDF file first.'); return; }

        const rangeInputs = document.querySelectorAll('input[name="rangeInput"]');
        let hasRange = false;
        const formData = new FormData();
        formData.append('pdfFile', selectedSplitFile);

        rangeInputs.forEach(input => {
            const val = input.value.trim();
            if (val) { formData.append('ranges', val); hasRange = true; }
        });

        if (!hasRange) { alert('Please enter at least one page range.'); return; }

        splitSubmitBtn.disabled = true;
        splitSpinner.classList.remove('hidden');
        splitBtnText.innerText = 'Processing & Compiling Archive... Please Wait';

        try {
            const response = await fetch('/api/splice', { method: 'POST', body: formData });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Server error.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'crafted_pdfs_package.zip';
            document.body.appendChild(a); a.click();
            a.remove(); window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.message);
        } finally {
            splitSubmitBtn.disabled = false;
            splitSpinner.classList.add('hidden');
            splitBtnText.innerText = 'Compile & Download Package Bundle (.ZIP)';
        }
    });

    // ── MERGE LOGIC ──────────────────────────────────────────────────────────
    const mergeDropZone   = document.getElementById('mergeDropZone');
    const mergeFileInput  = document.getElementById('mergeFileInput');
    const mergeFileDetails= document.getElementById('mergeFileDetails');
    const mergeFileList   = document.getElementById('mergeFileList');
    const mergeFileItems  = document.getElementById('mergeFileItems');
    const mergeForm       = document.getElementById('mergeForm');
    const mergeSubmitBtn  = document.getElementById('mergeSubmitBtn');
    const mergeBtnText    = document.getElementById('mergeBtnText');
    const mergeSpinner    = document.getElementById('mergeSpinner');

    let mergeFiles = [];

    mergeDropZone.addEventListener('click', () => mergeFileInput.click());
    mergeFileInput.addEventListener('change', (e) => addMergeFiles(e.target.files));

    ['dragenter', 'dragover'].forEach(ev => {
        mergeDropZone.addEventListener(ev, (e) => { e.preventDefault(); mergeDropZone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach(ev => {
        mergeDropZone.addEventListener(ev, (e) => { e.preventDefault(); mergeDropZone.classList.remove('drag-over'); });
    });
    mergeDropZone.addEventListener('drop', (e) => addMergeFiles(e.dataTransfer.files));

    function addMergeFiles(files) {
        for (const file of files) {
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                mergeFiles.push(file);
            }
        }
        renderMergeList();
    }

    function renderMergeList() {
        mergeFileItems.innerHTML = '';
        if (mergeFiles.length === 0) {
            mergeFileList.classList.add('hidden');
            mergeFileDetails.innerHTML = `Drag and drop multiple PDFs here, or <span class="text-blue-400">browse</span>`;
            return;
        }

        mergeFileList.classList.remove('hidden');
        mergeFileDetails.innerHTML = `<span class="text-green-400 font-semibold">${mergeFiles.length} file${mergeFiles.length > 1 ? 's' : ''} selected</span> — click to add more`;

        mergeFiles.forEach((file, i) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2.5 text-sm';
            li.innerHTML = `
                <span class="text-gray-300 truncate flex-1 mr-3">
                    <span class="text-gray-500 mr-2">${i + 1}.</span>${file.name}
                    <span class="text-gray-500 ml-2">(${(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </span>
                <button type="button" data-index="${i}" class="remove-merge-btn text-red-400 hover:text-red-300 text-lg font-bold focus:outline-none">✕</button>
            `;
            mergeFileItems.appendChild(li);
        });

        document.querySelectorAll('.remove-merge-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                mergeFiles.splice(parseInt(btn.dataset.index), 1);
                renderMergeList();
            });
        });
    }

    mergeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (mergeFiles.length < 2) { alert('Please select at least 2 PDF files to merge.'); return; }

        const formData = new FormData();
        mergeFiles.forEach(file => formData.append('pdfFiles', file));

        mergeSubmitBtn.disabled = true;
        mergeSpinner.classList.remove('hidden');
        mergeBtnText.innerText = 'Merging PDFs... Please Wait';

        try {
            const response = await fetch('/api/merge', { method: 'POST', body: formData });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Server error.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'merged_output.pdf';
            document.body.appendChild(a); a.click();
            a.remove(); window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.message);
        } finally {
            mergeSubmitBtn.disabled = false;
            mergeSpinner.classList.add('hidden');
            mergeBtnText.innerText = 'Merge & Download PDF';
        }
    });
});
