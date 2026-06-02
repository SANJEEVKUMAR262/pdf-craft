import express from 'express';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer to intercept files entirely within volatile system memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to parse complex strings (e.g., "1-3, 5, 7-9") into 0-indexed integers
function parsePageRanges(rangeStr, maxPages) {
    const pages = [];
    const groups = rangeStr.split(',');
    
    for (let group of groups) {
        group = group.trim();
        if (!group) continue;
        
        if (group.includes('-')) {
            const [startStr, endStr] = group.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= maxPages) pages.push(i - 1);
                }
            }
        } else {
            const page = parseInt(group, 10);
            if (!isNaN(page) && page >= 1 && page <= maxPages) {
                pages.push(page - 1);
            }
        }
    }
    return pages;
}

// Multi-splice compilation routing endpoint
app.post('/api/splice', upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded.' });
        }
        
        // Normalize incoming single strings or arrays of strings into a unified array
        let ranges = req.body.ranges;
        if (!ranges) {
            return res.status(400).json({ error: 'No target page ranges specified.' });
        }
        if (typeof ranges === 'string') {
            ranges = [ranges];
        }

        const sourcePdfDoc = await PDFDocument.load(req.file.buffer);
        const totalPages = sourcePdfDoc.getPageCount();
        
        const zip = new JSZip();
        let validFilesCount = 0;

        // Loop through every unique range structure submitted by the client
        for (let i = 0; i < ranges.length; i++) {
            const rangeStr = ranges[i].trim();
            if (!rangeStr) continue;

            const targetPages = parsePageRanges(rangeStr, totalPages);
            if (targetPages.length === 0) continue;

            // Generate an isolated PDFDocument container instance
            const newPdfDoc = await PDFDocument.create();
            const copiedPages = await newPdfDoc.copyPages(sourcePdfDoc, targetPages);
            copiedPages.forEach((page) => newPdfDoc.addPage(page));
            
            const pdfBytes = await newPdfDoc.save();
            
            // Inject raw binary asset into the zip file compilation track
            zip.file(`spliced_part_${i + 1}.pdf`, pdfBytes);
            validFilesCount++;
        }

        if (validFilesCount === 0) {
            return res.status(400).json({ error: 'None of the provided ranges matched your document page count.' });
        }

        // Pack the compressed archive structure down to a Node system buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        // Deliver payload headers to trigger automatic downstream download processing
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="crafted_pdfs_package.zip"');
        res.send(zipBuffer);

    } catch (error) {
        console.error('Compilation pipeline failure:', error);
        res.status(500).json({ error: 'An internal error occurred during multi-stage processing.' });
    }
});

// Explicit wildcard route pointing to client entry-point
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running smoothly on port ${port}`);
});