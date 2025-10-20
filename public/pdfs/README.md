# PDF Files Directory

## How to add PDF files

1. Download your PDF files from Google Drive
2. Place them in this directory: `/public/pdfs/`
3. Update the `pdfUrl` in your book data to use the local path

## Example:

If you have a file named `book1.pdf` in this directory, use:
```
pdfUrl: "/pdfs/book1.pdf"
```

## Current workflow:

1. **Download from Google Drive:**
   - Open your Google Drive link
   - Click "Download" button
   - Save to this folder

2. **Update book data:**
   - Go to the file where books are defined (e.g., `src/app/book/page.tsx`)
   - Change the `pdfUrl` from Google Drive link to local path
   - Example: Change from `https://drive.google.com/file/d/...` to `/pdfs/your-file.pdf`

## Benefits of local PDFs:

✅ No CORS issues  
✅ Works with PDF.js  
✅ Full control over PDF rendering  
✅ Can use Fabric.js annotations  
✅ Faster loading (no external requests)  

## File naming convention:

Use descriptive names without spaces:
- ✅ `book1-unit1.pdf`
- ✅ `english-basics.pdf`
- ❌ `Book 1 Unit 1.pdf` (has spaces)
