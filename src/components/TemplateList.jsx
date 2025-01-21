import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function TemplateList({ session }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTemplates();
  }, [session]);

  async function getTemplates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      alert('Error loading templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Saved Templates
        </h3>
        {loading ? (
          <p>Loading templates...</p>
        ) : (
          <ul className="mt-5 divide-y divide-gray-200">
            {templates.map((template) => (
              <li key={template.id} className="py-4">
                <div className="flex space-x-3">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-medium">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.subject}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TemplateList;