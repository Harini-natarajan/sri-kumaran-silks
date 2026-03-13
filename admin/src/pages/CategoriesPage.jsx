import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Tag, LayoutGrid, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import useAdminData from '../hooks/useAdminData';
import { fetchCategories } from '../services/adminApi';

const MANUAL_CATEGORIES_KEY = 'admin_manual_categories';

export default function CategoriesPage() {
  const loadCategories = useCallback(() => fetchCategories(), []);
  const { data: categories, setData: setCategories, loading, error } = useAdminData(loadCategories, []);
  
  const [manualCategories, setManualCategories] = useState(() => {
    try {
      const stored = localStorage.getItem(MANUAL_CATEGORIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [value, setValue] = useState('');
  const [editing, setEditing] = useState('');

  useEffect(() => {
    localStorage.setItem(MANUAL_CATEGORIES_KEY, JSON.stringify(manualCategories));
  }, [manualCategories]);

  const mergedCategories = useMemo(() => {
    const fromApi = Array.isArray(categories) ? categories : [];
    const fromManual = Array.isArray(manualCategories) ? manualCategories : [];
    return [...new Set([...fromApi, ...fromManual])];
  }, [categories, manualCategories]);

  const addCategory = (e) => {
    if (e) e.preventDefault();
    const normalized = value.trim();
    if (!normalized) return;

    if (editing) {
      const next = mergedCategories.map((item) => (item === editing ? normalized : item));
      setManualCategories(next);
      setCategories(next);
      setEditing('');
      setValue('');
      return;
    }

    if (!mergedCategories.includes(normalized)) {
      const next = [...mergedCategories, normalized];
      setManualCategories(next);
      setCategories(next);
    }

    setValue('');
  };

  const removeCategory = (target) => {
    if (!window.confirm(`Are you sure you want to remove the "${target}" category?`)) return;
    const next = mergedCategories.filter((item) => item !== target);
    setManualCategories(next);
    setCategories(next);
  };

  const handleEdit = (category) => {
    setEditing(category);
    setValue(category);
  };

  const cancelEdit = () => {
    setEditing('');
    setValue('');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader 
        title="Category Management" 
        subtitle="Define and organize your saree classifications for the catalog." 
      />

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        {/* Left Column: Form */}
        <div className="space-y-6">
          <div className="silk-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Tag size={20} />
              </div>
              <h2 className="text-xl font-black text-white">{editing ? 'Edit Frame' : 'Add Category'}</h2>
            </div>

            <form onSubmit={addCategory} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Category Designation</label>
                <input 
                  className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all shadow-inner placeholder:text-gray-700 font-medium" 
                  value={value} 
                  onChange={(e) => setValue(e.target.value)} 
                  placeholder="e.g., Soft Silk"
                  autoFocus={!!editing}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {editing ? (
                    <>Update Details</>
                  ) : (
                    <>
                      <Plus size={18} strokeWidth={3} />
                      Initialize
                    </>
                  )}
                </button>
                
                {editing && (
                  <button 
                    type="button"
                    onClick={cancelEdit}
                    className="w-14 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl transition-all flex items-center justify-center"
                    title="Cancel Edit"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-[2rem]">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Pro Tip</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Use concise, professional names for categories. These will appear in the main navigation and filter panels on the storefront.
            </p>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="silk-card overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutGrid size={18} className="text-gray-500" />
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Classifications</h3>
            </div>
            <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {mergedCategories.length} Units
            </span>
          </div>

          <div className="p-8">
            {loading && mergedCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Retrieving list...</span>
              </div>
            ) : mergedCategories.length === 0 ? (
              <div className="text-center py-20 bg-[#0c0b14]/50 rounded-[2rem] border border-dashed border-white/5">
                <Tag size={40} className="mx-auto text-gray-800 mb-4" />
                <h4 className="text-gray-400 font-bold">No Categories Configured</h4>
                <p className="text-xs text-gray-600 mt-1">Start by adding your first saree category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mergedCategories.map((category) => (
                  <div 
                    key={category} 
                    className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all group ${
                      editing === category 
                        ? 'bg-indigo-500/10 border-indigo-500/30' 
                        : 'bg-[#0c0b14]/50 border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${editing === category ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-gray-700'}`} />
                      <span className={`font-bold tracking-tight ${editing === category ? 'text-indigo-400' : 'text-gray-300'}`}>
                        {category}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => removeCategory(category)}
                        className="p-2.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
