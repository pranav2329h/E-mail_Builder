import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import EmailEditor from './components/EmailEditor';
import TemplateList from './components/TemplateList';
import Auth from './components/Auth';

function App() {
  const [session, setSession] = useState(null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Email Builder</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <EmailEditor session={session} />
            <TemplateList session={session} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;