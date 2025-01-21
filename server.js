import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

app.use(cors());
app.use(express.json());

// Serve static layout file
app.get('/api/getEmailLayout', (req, res) => {
  res.sendFile(path.join(__dirname, 'layouts', 'default.html'));
});

// Handle image uploads
app.post('/api/uploadImage', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Generate a unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${Date.now()}${fileExt}`;

    // Return the temporary URL (in production, you'd upload to Supabase storage)
    const imageUrl = `/uploads/${fileName}`;
    
    res.json({ 
      success: true, 
      url: imageUrl 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Generate and download template
app.post('/api/renderAndDownloadTemplate', (req, res) => {
  try {
    const { title, content, footer, images } = req.body;
    
    // Generate HTML template
    const imagesHtml = images.map(url => 
      `<img src="${url}" alt="Email content" style="max-width: 100%; margin: 10px 0;" />`
    ).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 20px; 
            }
            .content { 
              margin-bottom: 20px; 
            }
            .footer { 
              font-size: 14px; 
              color: #666; 
              border-top: 1px solid #eee; 
              padding-top: 20px; 
            }
            img {
              max-width: 100%;
              height: auto;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="title">${title || ''}</div>
            <div class="content">
              ${content || ''}
              ${imagesHtml}
            </div>
            <div class="footer">${footer || ''}</div>
          </div>
        </body>
      </html>
    `;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${title || 'email-template'}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});