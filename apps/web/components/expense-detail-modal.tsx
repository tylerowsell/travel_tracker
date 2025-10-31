'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:invoke>
<parameter name="@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  MessageCircle,
  Send,
  Smile,
  Heart,
  ThumbsUp,
  Laugh,
  Surprise,
} from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Comment {
  id: number;
  expense_id: number;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface Reaction {
  id: number;
  expense_id: number;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
  };
}

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '🎉', '🔥'];

export function ExpenseDetailModal({
  expense,
  isOpen,
  onClose,
}: {
  expense: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Fetch comments
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['expense-comments', expense?.id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/expenses/${expense.id}/comments`, {
        headers: { 'x-user-sub': user?.id || '' },
      });
      return data;
    },
    enabled: !!user && !!expense && isOpen,
  });

  // Fetch reactions
  const { data: reactions = [] } = useQuery<Reaction[]>({
    queryKey: ['expense-reactions', expense?.id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/expenses/${expense.id}/reactions`, {
        headers: { 'x-user-sub': user?.id || '' },
      });
      return data;
    },
    enabled: !!user && !!expense && isOpen,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await axios.post(
        `${API_URL}/expenses/${expense.id}/comments`,
        { content },
        { headers: { 'x-user-sub': user?.id || '' } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-comments', expense.id] });
      setCommentText('');
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      const { data } = await axios.post(
        `${API_URL}/expenses/${expense.id}/reactions`,
        { emoji },
        { headers: { 'x-user-sub': user?.id || '' } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-reactions', expense.id] });
      setShowEmojiPicker(false);
    },
  });

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: async (reactionId: number) => {
      await axios.delete(`${API_URL}/reactions/${reactionId}`, {
        headers: { 'x-user-sub': user?.id || '' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-reactions', expense.id] });
    },
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  const handleReaction = (emoji: string) => {
    // Check if user already reacted with this emoji
    const existing = reactions.find((r) => r.user_id === user?.id && r.emoji === emoji);
    if (existing) {
      removeReactionMutation.mutate(existing.id);
    } else {
      addReactionMutation.mutate(emoji);
    }
  };

  // Group reactions by emoji
  const reactionGroups = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  if (!isOpen || !expense) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {expense.merchant_name || 'Expense Details'}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(expense.dt).toLocaleDateString()}
                  </div>
                  {expense.location_text && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {expense.location_text}
                    </div>
                  )}
                  <span className="px-2 py-0.5 bg-primary/10 rounded capitalize">
                    {expense.category}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount */}
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <div className="flex items-baseline gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                <span className="text-3xl font-bold">{expense.amount}</span>
                <span className="text-lg text-muted-foreground">{expense.currency}</span>
              </div>
            </div>

            {/* Notes */}
            {expense.note && (
              <div className="mt-4 p-3 bg-background rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{expense.note}</p>
                </div>
              </div>
            )}
          </div>

          {/* Reactions */}
          <div className="px-6 py-3 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(reactionGroups).map(([emoji, reactionList]) => {
                const userReacted = reactionList.some((r) => r.user_id === user?.id);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`px-3 py-1.5 rounded-full border transition-all ${
                      userReacted
                        ? 'bg-primary/20 border-primary'
                        : 'bg-background border-border hover:bg-accent'
                    }`}
                    title={reactionList.map((r) => r.user?.display_name).join(', ')}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="ml-1.5 text-sm font-medium">{reactionList.length}</span>
                  </button>
                );
              })}

              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-full border border-border hover:bg-accent transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-card border border-border rounded-lg shadow-lg z-10 flex gap-1">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="p-2 hover:bg-accent rounded transition-colors text-xl"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    {comment.user?.avatar_url ? (
                      <img
                        src={comment.user.avatar_url}
                        alt={comment.user.display_name}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium">
                          {comment.user?.display_name?.[0] || '?'}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 bg-background rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.user?.display_name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
