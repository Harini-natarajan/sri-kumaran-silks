import React, { useCallback, useEffect } from 'react';
import { Star, MessageSquare, User, ShoppingBag, Quote } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import useAdminData from '../hooks/useAdminData';
import { fetchReviews } from '../services/adminApi';
import { useSocket } from '../context/SocketContext';

function RatingStars({ count }) {
  return (
    <div className="flex gap-1 text-amber-500">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star 
            key={index} 
            size={14} 
            fill={index <= count ? '#f59e0b' : 'transparent'} 
            className={index <= count ? 'drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]' : 'text-gray-700'}
        />
      ))}
    </div>
  );
}

export default function ReviewsRatingsPage() {
  const loadReviews = useCallback(() => fetchReviews(), []);
  const { data: reviews, loading, error, refresh } = useAdminData(loadReviews, []);
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
        socket.on('reviewCreated', () => {
            refresh();
        });
        return () => socket.off('reviewCreated');
    }
  }, [socket, refresh]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader 
        title="Customer Sentiment" 
        subtitle="Monitor product feedback, satisfaction levels, and market reception." 
      />

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-medium">
            {error}
        </div>
      )}

      <div className="silk-card overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Quote size={18} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px]">Feedback Repository</h3>
            </div>
            <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {reviews.length} Submissions
            </span>
        </div>

        <div className="overflow-x-auto">
          {loading && !reviews.length ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Parsing sentiments...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-24 opacity-50">
                <MessageSquare size={48} className="mx-auto text-gray-800 mb-4" />
                <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">No feedback recorded yet</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Product Entity</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Contributor</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Sentiment</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Context</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reviews.map((review) => (
                  <tr key={review.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 transition-colors border border-white/5">
                                <ShoppingBag size={18} />
                            </div>
                            <span className="font-bold text-white tracking-tight">{review.saree}</span>
                        </div>
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                                <User size={14} />
                            </div>
                            <span className="text-sm font-bold text-gray-300">{review.customer}</span>
                        </div>
                    </td>
                    <td className="px-8 py-6">
                      <RatingStars count={review.rating} />
                    </td>
                    <td className="px-8 py-6">
                        <div className="max-w-md">
                            {review.title && <h4 className="text-sm font-bold text-gray-200 mb-1">{review.title}</h4>}
                            <p className="text-sm text-gray-500 italic line-clamp-2 leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                        </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{review.date}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
