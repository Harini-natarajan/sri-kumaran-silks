import React, { useCallback, useState } from 'react';
import { Plus, Trash2, Ticket, Zap, Calendar, IndianRupee, Percent } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import useAdminData from '../hooks/useAdminData';
import { fetchCoupons, saveCoupon, removeCouponById } from '../services/adminApi';

export default function DiscountsOffersPage() {
  const loadData = useCallback(() => fetchCoupons(), []);
  const { data: coupons, loading, error, refresh } = useAdminData(loadData, []);

  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');
  const [description, setDescription] = useState('');

  const submitOffer = async (e) => {
    e.preventDefault();
    if (!code || !discountValue || !expiryDate) return;

    setSaving(true);
    try {
      await saveCoupon({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minimumPurchaseAmount: minSpend || 0,
        expiryDate,
        usageLimit,
        description
      });
      setCode('');
      setDiscountValue('');
      setMinSpend('');
      setExpiryDate('');
      setUsageLimit('100');
      setDescription('');
      await refresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to retire this campaign?')) return;
    try {
      await removeCouponById(id);
      await refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader 
        title="Discounts & Offers" 
        subtitle="Manage promotional codes, holiday campaigns, and customer loyalty incentives." 
      />
      
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-medium">
            {error}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[450px_1fr]">
        {/* Left Column: Create Coupon */}
        <fieldset disabled={saving} className="disabled:opacity-75 space-y-6">
          <form className="silk-card p-8" onSubmit={submitOffer}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Ticket size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Issue Coupon</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Configure parameters</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Authentication Code</label>
                <div className="relative">
                    <input 
                      required 
                      className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 pl-5 pr-12 text-white focus:border-indigo-500/50 outline-none transition-all shadow-inner placeholder:text-gray-700 font-bold tracking-widest uppercase" 
                      placeholder="Ex: SILK2026" 
                      value={code} 
                      onChange={(e) => setCode(e.target.value)} 
                    />
                    <Zap size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-500/50" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Logic Type</label>
                  <select 
                    className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer text-sm font-medium" 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage" className="bg-[#0c0b14]">Percentage (%)</option>
                    <option value="fixed" className="bg-[#0c0b14]">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Reward Value</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                        {discountType === 'percentage' ? <Percent size={14} /> : <IndianRupee size={14} />}
                    </div>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 pl-10 pr-5 text-white focus:border-indigo-500/50 outline-none transition-all text-sm font-bold" 
                      placeholder="0" 
                      value={discountValue} 
                      onChange={(e) => setDiscountValue(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Threshold Amount (₹)</label>
                <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                        <IndianRupee size={14} />
                    </div>
                    <input 
                      type="number" 
                      min="0" 
                      className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 pl-10 pr-5 text-white focus:border-indigo-500/50 outline-none transition-all text-sm font-bold" 
                      placeholder="Minimum cart total (Optional)" 
                      value={minSpend} 
                      onChange={(e) => setMinSpend(e.target.value)} 
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Usage Cap</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all text-sm font-bold" 
                      placeholder="100" 
                      value={usageLimit} 
                      onChange={(e) => setUsageLimit(e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Expiration Timeline</label>
                    <div className="relative">
                        <input 
                          required 
                          type="date" 
                          className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all text-sm font-medium [color-scheme:dark]" 
                          value={expiryDate} 
                          onChange={(e) => setExpiryDate(e.target.value)} 
                        />
                        <Calendar size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Internal Description</label>
                <input 
                    type="text"
                    className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all text-sm font-medium" 
                    placeholder="e.g., Diwali Special Sale 2026" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                />
              </div>
            </div>

            <button 
              className="mt-10 w-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest" 
              type="submit"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus size={18} strokeWidth={3} />
                  Authorize Campaign
                </>
              )}
            </button>
          </form>
          
          <div className="bg-[#12111a] border border-white/5 p-6 rounded-[2rem]">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">Campaign Intelligence</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Coupons with expiration dates drive urgency. Fixed amount discounts usually convert better for high-value silk products.
            </p>
          </div>
        </fieldset>

        {/* Right Column: Active Coupons */}
        <div className="silk-card overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Deployments</h3>
            <span className="bg-indigo-500/10 px-3 py-1 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/20">
              {coupons.length} LIVE
            </span>
          </div>

          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-bold">Synchronizing...</span>
               </div>
            ) : coupons.length === 0 ? (
               <div className="text-center py-20 bg-[#0c0b14]/50 rounded-[2rem] border border-dashed border-white/5">
                <Ticket size={40} className="mx-auto text-gray-800 mb-4" />
                <h4 className="text-gray-400 font-bold">Catalogue is clean</h4>
                <p className="text-xs text-gray-600 mt-1">No active discounts or campaigns found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {coupons.map((offer) => (
                  <div key={offer.id} className="group relative rounded-[2rem] border border-white/5 bg-[#0c0b14]/50 p-6 transition-all hover:border-indigo-500/20 hover:bg-white/[0.01] flex items-center justify-between overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                            <span className="text-[10px] font-black text-gray-500 uppercase leading-none mb-1">Val</span>
                            <span className="text-lg font-black text-white leading-none">
                                {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                            </span>
                        </div>
                        
                        <div>
                            <p className="text-lg font-black text-white tracking-widest">{offer.code}</p>
                            <p className="text-[10px] text-gray-600 font-bold uppercase -mt-0.5">{offer.description || 'Global Campaign'}</p>
                            
                            <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase">
                                    <Calendar size={12} className="text-gray-600" />
                                    Expires {new Date(offer.expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                {offer.minimumPurchaseAmount > 0 ? (
                                    <span className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-bold uppercase">
                                        <IndianRupee size={12} className="text-indigo-500/50" />
                                        Min Spend ₹{offer.minimumPurchaseAmount}
                                    </span>
                                ) : null}
                            </div>
                            
                            <div className="mt-3 w-full">
                                <div className="flex items-center justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1.5">
                                    <span>Usage Intensity</span>
                                    <span>{offer.usedCount || 0} / {offer.usageLimit || 100}</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500" 
                                        style={{ width: `${Math.min(100, ((offer.usedCount || 0) / (offer.usageLimit || 100)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => removeCoupon(offer.id)} 
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                            title="Deactivate Campaign"
                        >
                            <Trash2 size={20} />
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
