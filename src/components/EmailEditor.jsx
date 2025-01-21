import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../supabaseClient';

function EmailEditor({ session }) {
  const { register, handleSubmit, watch, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef();

  const watchedFields = watch();

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('email-images')
          .upload(`public/${fileName}`, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('email-images')
          .getPublicUrl(`public/${fileName}`);

        newImages.push(publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    setImages([...images, ...newImages]);
  };

  const generatePreview = () => {
    const { title, content, footer } = watchedFields;
    const imagesHtml = images.map(url => 
      `<img src="${url}" alt="Email content" style="max-width: 100%; margin: 10px 0;" />`
    ).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .content { margin-bottom: 20px; }
            .footer { font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
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

    setPreview(html);
    return html;
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const html = generatePreview();
      
      const { error } = await supabase.from('email_templates').insert([
        {
          name: data.title,
          subject: data.title,
          content: {
            title: data.title,
            body: data.content,
            footer: data.footer,
            html: html,
            images: images
          },
          image_urls: images,
          user_id: session.user.id
        }
      ]);

      if (error) throw error;
      reset();
      setImages([]);
      setPreview(null);
      alert('Template saved successfully!');
    } catch (error) {
      alert('Error saving template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/renderAndDownloadTemplate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: watchedFields.title,
          content: watchedFields.content,
          footer: watchedFields.footer,
          images: images,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate template');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${watchedFields.title || 'email-template'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download template');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Create Email Template
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                {...register('title', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                onChange={() => generatePreview()}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="content"
                rows={6}
                {...register('content', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                onChange={() => generatePreview()}
              />
            </div>

            <div>
              <label htmlFor="footer" className="block text-sm font-medium text-gray-700">
                Footer
              </label>
              <textarea
                id="footer"
                rows={2}
                {...register('footer')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                onChange={() => generatePreview()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Images
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                ))}
              </div>
            )}

            <div className="flex space-x-4 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {loading ? 'Saving...' : 'Save Template'}
              </button>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Download HTML
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Preview
          </h3>
          <div className="border rounded-md p-4 min-h-[500px] bg-gray-50">
            {preview ? (
              <iframe
                srcDoc={preview}
                title="Email Preview"
                className="w-full h-full min-h-[500px] border-0"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Start editing to see the preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailEditor;