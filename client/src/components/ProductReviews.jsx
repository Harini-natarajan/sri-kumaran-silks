import React, { useState, useContext } from 'react';
import { Star, MessageSquare, User, Calendar, Check, X, AlertCircle, TrendingUp } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { createProductReview } from '../services/api';

const ProductReviews = ({ product, onReviewAdded }) => {
    const { user } = useContext(ShopContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const reviews = product.reviews || [];
    const averageRating = product.rating || 0;
    const totalReviews = product.numReviews || 0;

    // Calculate rating stars breakdown
    const breakdown = [5, 4, 3, 2, 1].map(star => {
        const count = reviews.filter(r => Math.round(r.rating) === star).length;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        return { star, count, percentage };
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createProductReview(product._id, { rating, comment, title });
            setSuccess(true);
            setComment('');
            setTitle('');
            setRating(5);
            if (onReviewAdded) onReviewAdded();
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccess(false);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-16 bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Rated {averageRating.toFixed(1)}</h2>
                             <Star className="text-amber-500 fill-amber-500" size={28} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{totalReviews} verified reviews</p>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 px-8 py-3.5 rounded-xl bg-black text-white hover:bg-gray-800 transition-all font-bold tracking-wider uppercase text-xs"
                    >
                        Add a Review
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Stats Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        {breakdown.map(({ star, count, percentage }) => (
                            <div key={star} className="flex items-center gap-4 group">
                                <div className="flex items-center gap-1 w-20">
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={12} 
                                            className={`${i < star ? 'text-amber-500 fill-amber-500' : 'text-gray-200 dark:text-gray-800'}`} 
                                        />
                                    ))}
                                </div>
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-amber-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs font-bold text-gray-400 w-8">{count}</span>
                            </div>
                        ))}

                        <div className="mt-8 p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="text-amber-600" size={20} />
                                <h4 className="font-bold text-amber-900 dark:text-amber-200">98% Recommendation</h4>
                            </div>
                            <p className="text-sm text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                                Our customers highly value the quality and craftsmanship of this silk saree.
                            </p>
                        </div>
                    </div>

                    {/* Reviews List */}
                    <div className="lg:col-span-8 space-y-6">
                        {reviews.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No reviews yet</h3>
                                <p className="text-gray-500">Be the first to share your experience with this saree!</p>
                            </div>
                        ) : (
                            reviews.slice(0, 5).map((review) => (
                                <ReviewCard key={review._id} review={review} />
                            ))
                        )}

                        {reviews.length > 5 && (
                            <button className="w-full py-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                Read all {totalReviews} reviews
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Write Review Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !loading && setIsModalOpen(false)}
                    ></div>
                    
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Write a review</h3>
                                <p className="text-sm text-gray-500">Share your experience with other shoppers!</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {success ? (
                                <div className="py-12 text-center space-y-4">
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                        <Check size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold">Review Submitted!</h4>
                                    <p className="text-gray-500">Thank you for your valuable feedback.</p>
                                </div>
                            ) : (
                                <>
                                    {error && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm font-medium">
                                            <AlertCircle size={18} />
                                            {error}
                                        </div>
                                    )}

                                    {/* Star Rating Selector */}
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setRating(s)}
                                                    onMouseEnter={() => setRating(s)}
                                                    className="transition-transform active:scale-90"
                                                >
                                                    <Star 
                                                        size={40} 
                                                        className={`${s <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200 dark:text-gray-800'}`} 
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                            {rating === 5 ? 'Excellent' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Title Input */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Review Title (Optional)</label>
                                            <input 
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Summarize your experience"
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white"
                                            />
                                        </div>

                                        {/* Review Input */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Review Details (Optional)</label>
                                            <textarea 
                                                rows={5}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="What did you like or dislike? How was the fabric quality?"
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white resize-none"
                                            ></textarea>
                                        </div>
                                    </div>

                                    {!user ? (
                                        <p className="text-center text-sm text-gray-500">
                                            Please sign in to submit your review.
                                        </p>
                                    ) : (
                                        <button 
                                            disabled={loading}
                                            type="submit"
                                            className="w-full py-5 bg-gray-800 dark:bg-white dark:text-black text-white rounded-2xl font-bold tracking-widest uppercase text-sm hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
                                        >
                                            {loading ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    )}
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReviewCard = ({ review }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = (review.comment || '').length > 250;

    return (
        <div className="p-8 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-amber-500/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                            <Star 
                                key={i} 
                                size={14} 
                                className={`${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200 dark:text-gray-800'}`} 
                            />
                        ))}
                    </div>
                    {review.title && <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{review.title}</h4>}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest overflow-hidden h-4">
                    <Check size={14} className="text-green-500" />
                    Verified Purchase
                </div>
            </div>

            <p className={`text-gray-700 dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-line ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
                {review.comment}
                {!isExpanded && isLong && (
                    <button 
                        onClick={() => setIsExpanded(true)}
                        className="text-amber-600 font-bold ml-2 hover:underline inline-flex items-center gap-1"
                    >
                        ...show more
                    </button>
                )}
            </p>

            <div className="flex items-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-800">
                    <User size={18} />
                </div>
                <div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-sm">{review.name}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        <Calendar size={10} />
                        {new Date(review.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductReviews;
