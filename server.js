import express from 'express';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Store uploaded files temporarily in system memory as Buffers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to turn "20-50, 60-170" strings into a clean array of page indices
function parsePageRanges(rangeStr, maxPages) {
    const pages = [];
    const groups = rangeStr.split(',');

    for (let group of groups) {
        group = group.trim();
        if (group.includes('-')) {
            const [start, end] = group.split('-').map(Number);
            // Convert to 0-based indexing for pdf-lib
            for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= maxPages) pages.push(i - 1);
            }
        } else {
            const page = Number(group);
            if (page >= 1 && page <= maxPages) pages.push(page - 1);
        }
    }
    return pages;
}

// Processing API Endpoint
app.post('/api/process-pdf', upload.array('pdfs'), async (req, res) => {
    try {
        const files = req.files;
        const configs = JSON.parse(req.body.configs); 

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < files.length; i++) {
            const fileBuffer = files[i].buffer;
            const config = configs[i]; 

            const srcPdf = await PDFDocument.load(fileBuffer);
            const totalPages = srcPdf.getPageCount();
            
            let targetPages = [];
            if (config.range && config.range.trim() !== "") {
                targetPages = parsePageRanges(config.range, totalPages);
            } else {
                // Default: Take all pages if input box is empty
                targetPages = Array.from({ length: totalPages }, (_, index) => index);
            }

            const copiedPages = await mergedPdf.copyPages(srcPdf, targetPages);
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=crafted_document.pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("Error processing PDF:", error);
        res.status(500).json({ error: 'Failed to process PDF documents.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});