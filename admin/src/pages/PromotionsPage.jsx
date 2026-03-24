import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { fetchPromotions, savePromotion, removePromotionById } from '../services/adminApi';

const PROMO_TYPES = [
  { id: 'hero_banner', label: 'Hero Banners' },
  { id: 'promo_slide', label: 'Promo Slides' },
  { id: 'announcement', label: 'Announcement Bar' }
];

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hero_banner');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await fetchPromotions();
      setPromotions(data);
    } catch (error) {
      console.error("Failed to load promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData(promo);
    } else {
      setEditingPromo(null);
      setFormData({
        type: activeTab,
        isActive: true,
        order: 0,
        link: '/products',
        bgColor: '#9A3412',
        textColor: '#ffffff'
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      await removePromotionById(id);
      loadPromotions();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await savePromotion(formData);
      setIsModalOpen(false);
      loadPromotions();
    } catch (err) {
      console.error("Failed to save promotion:", err);
      alert('Failed to save promotion');
    }
  };

  const filteredPromos = promotions
    .filter(p => p.type === activeTab)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader 
          title="Promotions & Placements" 
          subtitle="Manage homepage banners, storefront promos, and announcement ticker."
        />
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      <div className="flex space-x-2 border-b border-white/10 pb-4">
        {PROMO_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setActiveTab(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === type.id 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromos.map(promo => (
            <div key={promo.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${promo.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {promo.isActive ? 'Active' : 'Draft'}
                </span>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(promo)} className="p-1 text-gray-400 hover:text-indigo-400">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(promo.id)} className="p-1 text-gray-400 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {promo.type === 'hero_banner' && (
                <div>
                  <div className="aspect-video w-full rounded bg-black/50 overflow-hidden mb-3 border border-white/5">
                    {promo.image ? (
                      <img src={promo.image} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Image</div>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">{promo.title || '(No Title)'}</h4>
                  <p className="text-xs text-amber-400 mb-2">{promo.subtitle}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{promo.description}</p>
                </div>
              )}

              {promo.type === 'promo_slide' && (
                <div className="space-y-2">
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded uppercase tracking-wider text-gray-300">{promo.tag}</span>
                  <h4 className="font-bold text-white text-sm">{promo.title}</h4>
                  <div className="bg-black/30 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-gray-400">{promo.subtitle}</span>
                    <span className="text-sm font-black text-amber-400">{promo.code}</span>
                    <span className="text-xs text-gray-400">{promo.afterCode}</span>
                  </div>
                </div>
              )}

              {promo.type === 'announcement' && (
                <div className="space-y-4">
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: promo.bgColor || '#9A3412', color: promo.textColor || '#fff' }}
                  >
                    <p className="text-sm font-medium tracking-wider">{promo.text}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Target link:</span>
                    <span className="text-indigo-400 truncate">{promo.link}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-gray-500">
                <span>Order sorting: {promo.order}</span>
              </div>
            </div>
          ))}
          {filteredPromos.length === 0 && (
            <div className="col-span-full py-10 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
              No promotions found for {PROMO_TYPES.find(t=>t.id===activeTab).label}. Click 'Add New' to create one.
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161521] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white">
                {editingPromo ? 'Edit Promotion' : `Add ${PROMO_TYPES.find(t=>t.id===activeTab).label}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Display Order (0 is first)</label>
                  <input type="number" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})}
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-[#161521]"
                      checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <span className="text-sm font-bold text-white">Active (Visible on Storefront)</span>
                  </label>
                </div>

                <div className="col-span-2">
                  <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Click Link URL</label>
                  <input type="text" placeholder="/products?category=Silk"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                    value={formData.link || ''} onChange={e => setFormData({...formData, link: e.target.value})}
                  />
                </div>

                {/* Hero Banner Fields */}
                {formData.type === 'hero_banner' && (
                  <>
                    <div className="col-span-2">
                      <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Image URL</label>
                      <input type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Title</label>
                      <input type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Subtitle</label>
                      <input type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Description</label>
                      <textarea rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {/* Promo Slide Fields */}
                {formData.type === 'promo_slide' && (
                  <>
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Tag (e.g. Limited Offer)</label>
                        <input type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                          value={formData.tag || ''} onChange={e => setFormData({...formData, tag: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Button CTA</label>
                        <input type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                          value={formData.cta || ''} onChange={e => setFormData({...formData, cta: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Main Title</label>
                      <input type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2 grid grid-cols-3 gap-2 border border-white/5 p-4 rounded-xl">
                      <div>
                        <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Pre Code Text</label>
                        <input type="text" placeholder="Use code"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                          value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block tracking-wider text-[10px] font-bold text-amber-500 uppercase mb-2">Discount Code</label>
                        <input type="text" placeholder="SILK20"
                          className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-amber-400 font-bold text-center focus:border-amber-500 outline-none"
                          value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Post Code Text</label>
                        <input type="text" placeholder="at checkout"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                          value={formData.afterCode || ''} onChange={e => setFormData({...formData, afterCode: e.target.value})}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Announcement Fields */}
                {formData.type === 'announcement' && (
                  <>
                    <div className="col-span-2">
                      <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Announcement Text</label>
                      <input type="text" required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.text || ''} onChange={e => setFormData({...formData, text: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Background Color</label>
                      <div className="flex gap-2">
                        <input type="color" className="h-10 w-10 rounded border border-white/5 bg-transparent"
                          value={formData.bgColor || '#9A3412'} onChange={e => setFormData({...formData, bgColor: e.target.value})}
                        />
                        <input type="text" className="flex-1 bg-white/5 border border-white/10 rounded-r-xl px-4 text-white text-sm outline-none"
                          value={formData.bgColor || '#9A3412'} onChange={e => setFormData({...formData, bgColor: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block tracking-wider text-[10px] font-bold text-gray-500 uppercase mb-2">Text Color</label>
                      <div className="flex gap-2">
                        <input type="color" className="h-10 w-10 rounded border border-white/5 bg-transparent"
                          value={formData.textColor || '#ffffff'} onChange={e => setFormData({...formData, textColor: e.target.value})}
                        />
                        <input type="text" className="flex-1 bg-white/5 border border-white/10 rounded-r-xl px-4 text-white text-sm outline-none"
                          value={formData.textColor || '#ffffff'} onChange={e => setFormData({...formData, textColor: e.target.value})}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="pt-6 border-t border-white/5 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5"
                >Cancel</button>
                <button type="submit"
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white"
                >Save Promotion</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
