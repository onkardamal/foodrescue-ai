
import React, { useState, useRef, useEffect } from 'react';
import { User, UserStats, DonationHistoryItem, Review } from '../types';
import { ArrowLeft, User as UserIcon, Settings, Bell, Shield, HelpCircle, LogOut, Moon, Sun, ChevronRight, Award, Flame, X, Lock, Eye, FileText, Sparkles, Check, Clock, Star, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import Analytics from './Analytics';

interface ProfileProps {
  user: User | null;
  stats: UserStats;
  onLogout: () => void;
  onUpdateStats: (stats: UserStats) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, stats, onLogout, onUpdateStats }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('history');
  const [showRateModal, setShowRateModal] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleBack = () => {
    navigate('/');
  };

  const handleCloseModal = () => {
    setShowRateModal(null);
    setRating(0);
    setHoverRating(0);
    setSelectedTags([]);
    setReviewComment('');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    const updatedHistory = stats.history.map(item => {
      if (item.id === showRateModal) {
        return {
          ...item,
          review: {
            rating,
            tags: selectedTags,
            comment: reviewComment.trim() || undefined
          }
        };
      }
      return item;
    });

    onUpdateStats({
      ...stats,
      history: updatedHistory
    });

    handleCloseModal();
    
    // Success feedback
    setShowConfetti(true);
    setToast("Review Submitted! Trust Score Updated.");
    setTimeout(() => {
        setShowConfetti(false);
        setToast(null);
    }, 4000);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Simple Confetti Animation Component
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-[2000] overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            backgroundColor: ['#FFD700', '#FF8C00', '#00796B', '#80CBC4'][i % 4],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation-name: confetti; animation-timing-function: linear; animation-fill-mode: forwards; }
      `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 pb-24 md:pb-8 animate-in slide-in-from-right duration-300 relative">
      {showConfetti && <Confetti />}
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] bg-white dark:bg-slate-900 border-2 border-[#00796B] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="text-[#00796B]" size={24} />
            <span className="font-bold text-[#212121] dark:text-white">{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="pt-4 px-4 pb-4 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-sm mb-4 flex items-center gap-3">
        <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            type="button"
            aria-label="Back"
        >
            <ArrowLeft size={24} className="text-[#212121] dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-[#212121] dark:text-white">My Impact</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {/* High-Energy Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-xl border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center text-center relative overflow-hidden group">
             {/* Decorative Background */}
             <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-amber-500/5 pointer-events-none"></div>
             
             <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full border-[6px] border-amber-400 p-1 shadow-amber-400/20 shadow-2xl">
                    <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                        alt={user.name}
                        className="w-full h-full rounded-full bg-slate-200 object-cover"
                    />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-slate-900">
                    <Sparkles size={20} fill="currentColor" />
                </div>
             </div>
             
             <div className="space-y-1 mb-6">
                 <h2 className="text-3xl font-black text-[#212121] dark:text-white flex items-center justify-center gap-2">
                    {stats.xp.toLocaleString()} <span className="text-[#00796B]">XP</span>
                    <Sparkles className="text-amber-500" size={24} fill="currentColor" />
                 </h2>
                 <p className="text-lg font-bold text-amber-600 uppercase tracking-widest">Food Saver Lvl {stats.level}</p>
             </div>

             <div className="w-full max-w-[280px] h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div 
                    className="h-full bg-gradient-to-r from-[#00796B] to-amber-400 transition-all duration-1000 ease-out" 
                    style={{ width: '65%' }}
                ></div>
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase">350 XP to next tier</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button 
                onClick={() => setActiveTab('stats')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'stats' ? 'bg-white dark:bg-slate-800 text-[#00796B] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Stats
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-[#00796B] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                History
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' ? (
            <Analytics stats={stats} />
        ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-black text-[#212121] dark:text-white uppercase tracking-wider text-sm pl-2">Recent Timeline</h3>
                
                <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                    {stats.history.map((item) => {
                        const isCompleted = item.status === 'completed';
                        const isRated = !!item.review;

                        return (
                            <div key={item.id} className="relative">
                                {/* Timeline Marker */}
                                <div className={`absolute -left-[27px] top-4 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center z-10 ${
                                    isCompleted ? 'bg-[#00796B]' : 'bg-slate-300 dark:bg-slate-600'
                                }`}>
                                    {isCompleted ? <Check size={12} className="text-white" strokeWidth={4} /> : <Clock size={12} className="text-white" strokeWidth={4} />}
                                </div>

                                {/* History Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 group hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0 pr-4">
                                          <h4 className="font-bold text-lg text-[#212121] dark:text-white truncate">{item.foodName}</h4>
                                          <div className="flex flex-col gap-0.5 mt-1">
                                              <p className="text-xs text-slate-500 font-medium">{item.date}</p>
                                              <p className="text-sm text-[#00796B] font-bold">Picked up by: {item.ngoName}</p>
                                          </div>
                                      </div>
                                      <div className="bg-teal-50 dark:bg-teal-900/30 text-[#00796B] px-3 py-1.5 rounded-xl font-black text-xs shrink-0 flex flex-col items-center">
                                          <Sparkles size={14} className="mb-0.5" />
                                          +{item.points} XP
                                      </div>
                                    </div>

                                    {/* Review Area */}
                                    {isCompleted && (
                                        <div className="mt-4">
                                            {isRated ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-0.5 text-amber-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                size={16} 
                                                                fill={i < (item.review?.rating || 0) ? "currentColor" : "none"} 
                                                            />
                                                        ))}
                                                        <span className="text-xs font-bold text-slate-400 ml-2">Rating given</span>
                                                    </div>
                                                    {item.review?.comment && (
                                                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#00796B]/20"></div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">
                                                          "{item.review.comment}"
                                                        </p>
                                                      </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setShowRateModal(item.id)}
                                                    className="px-4 py-1.5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:border-[#00796B] hover:text-[#00796B] transition-all"
                                                >
                                                    Rate Experience
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Action List Section (Settings & Logout) */}
        <div className="pt-8 space-y-4">
            <h3 className="font-black text-[#212121] dark:text-white uppercase tracking-wider text-sm pl-2">Account Settings</h3>
            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                <button 
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                            {theme === 'light' ? <Sun size={20} className="text-slate-400" /> : <Moon size={20} className="text-slate-400" />}
                        </div>
                        <span className="font-medium text-[#212121] dark:text-white">Dark Mode</span>
                    </div>
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-[#00796B]' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </button>
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
                            <LogOut size={20} className="text-red-500" />
                        </div>
                        <span className="font-bold">Log Out</span>
                    </div>
                    <ChevronRight size={18} className="text-red-300" />
                </button>
            </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRateModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
              <div 
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
              >
                  <div className="p-8 text-center max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-end -mt-4 -mr-4 mb-2">
                          <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600">
                              <X size={24} />
                          </button>
                      </div>

                      <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                          <HeartHandshake size={40} className="text-[#00796B]" />
                      </div>

                      <h3 className="text-xl font-black text-[#212121] dark:text-white leading-tight mb-4">
                          How was your experience with {stats.history.find(h => h.id === showRateModal)?.ngoName}?
                      </h3>

                      {/* Interactive Stars */}
                      <div className="flex justify-center gap-2 mb-6">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                  key={star}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  onClick={() => setRating(star)}
                                  className="transition-transform active:scale-90 hover:scale-110"
                              >
                                  <Star 
                                      size={36} 
                                      className={`${(hoverRating || rating) >= star ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                                      fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                                      strokeWidth={2.5}
                                  />
                              </button>
                          ))}
                      </div>

                      {/* Feedback Chips */}
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                          {["Punctual ⏰", "Polite 😊", "Professional 👔"].map(tag => (
                              <button
                                  key={tag}
                                  onClick={() => toggleTag(tag)}
                                  className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                                      selectedTags.includes(tag)
                                      ? 'bg-[#00796B] border-[#00796B] text-white shadow-sm'
                                      : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                                  }`}
                              >
                                  {tag}
                              </button>
                          ))}
                      </div>

                      {/* Review Text Area */}
                      <div className="mb-8 text-left">
                          <label htmlFor="review-comment" className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Write a Review (Optional)</label>
                          <textarea 
                              id="review-comment"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#00796B] focus:bg-white dark:focus:bg-slate-900 outline-none text-sm text-[#212121] dark:text-white transition-all resize-none h-24 placeholder:text-slate-400"
                              placeholder="Share your experience with the pickup..."
                          />
                      </div>

                      <button 
                        onClick={handleReviewSubmit}
                        disabled={rating === 0}
                        className="w-full py-4 bg-[#212121] dark:bg-white text-white dark:text-[#212121] rounded-2xl font-black text-lg shadow-xl hover:bg-black dark:hover:bg-slate-200 disabled:opacity-30 disabled:hover:scale-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                          Submit Review
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Profile;
