import { useState, useEffect } from 'react';
import { MessageCircle, Reply, Edit, Trash2, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { ProductComment } from '../types';

interface CommentsSectionProps {
  productId: string;
}

const CommentsSection = ({ productId }: CommentsSectionProps) => {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [productId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_product_comments', {
        product_id_param: productId
      });

      if (error) throw error;

      // Organize comments into a tree structure
      const commentsMap = new Map();
      const rootComments: ProductComment[] = [];

      data?.forEach((comment: any) => {
        const commentObj: ProductComment = {
          id: comment.id,
          product_id: comment.product_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          parent_id: comment.parent_id,
          is_edited: comment.is_edited,
          profiles: {
            id: comment.user_id,
            full_name: comment.user_full_name || 'Unknown User'
          },
          replies: []
        };

        commentsMap.set(comment.id, commentObj);

        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('add_comment', {
        product_id_param: productId,
        content_param: newComment.trim()
      });

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string, content: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('add_comment', {
        product_id_param: productId,
        content_param: content.trim(),
        parent_id_param: parentId
      });

      if (error) throw error;

      fetchComments();
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('update_comment', {
        comment_id_param: commentId,
        new_content_param: editContent.trim()
      });

      if (error) throw error;

      setEditContent('');
      setEditingComment(null);
      fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('delete_comment', {
        comment_id_param: commentId
      });

      if (error) throw error;

      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const ReplyTextarea = ({ commentId, onSubmit, onCancel }: { 
    commentId: string; 
    onSubmit: (content: string) => void; 
    onCancel: () => void; 
  }) => {
    const [content, setContent] = useState('');
    
    return (
      <div className="mt-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-3 py-2 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors resize-none"
          rows={3}
          placeholder="Write a reply..."
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              if (content.trim()) {
                onSubmit(content.trim());
                setContent('');
              }
            }}
            disabled={isSubmitting || !content.trim()}
            className="bg-brand-green text-black px-3 py-1 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reply'}
          </button>
          <button
            onClick={() => {
              setContent('');
              onCancel();
            }}
            className="bg-brand-gray-dark text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-brand-gray-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const CommentItem = ({ comment, isReply = false }: { comment: ProductComment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-brand-gray-dark pl-4' : ''} mb-4`}>
      <div className="bg-brand-gray-darker rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-black font-bold text-sm">
              {comment.profiles?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-medium text-white">{comment.profiles?.full_name || 'Unknown User'}</p>
              <p className="text-xs text-brand-gray">
                {formatDate(comment.created_at)}
                {comment.is_edited && ' (edited)'}
              </p>
            </div>
          </div>
          {user?.id === comment.user_id && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingComment(comment.id);
                  setEditContent(comment.content);
                }}
                className="text-brand-gray hover:text-white transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-brand-gray hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {editingComment === comment.id ? (
          <div className="mb-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-3 py-2 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors resize-none"
              rows={3}
              placeholder="Edit your comment..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleEditComment(comment.id)}
                disabled={isSubmitting}
                className="bg-brand-green text-black px-3 py-1 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}
                className="bg-brand-gray-dark text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-brand-gray-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-white mb-3">{comment.content}</p>
        )}

        {!isReply && (
          <div>
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="flex items-center gap-1 text-brand-gray hover:text-white transition-colors text-sm"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
            
            {replyingTo === comment.id && (
              <ReplyTextarea
                commentId={comment.id}
                onSubmit={(content) => {
                  handleSubmitReply(comment.id, content);
                  setReplyingTo(null);
                }}
                onCancel={() => setReplyingTo(null)}
              />
            )}
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-brand-green" />
        <h3 className="text-xl font-bold text-white">Comments</h3>
        <span className="text-brand-gray">({comments.length})</span>
      </div>

      {/* Add new comment */}
      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors resize-none"
          rows={4}
          placeholder={user ? "Add a comment..." : "Sign in to comment"}
          disabled={!user}
        />
        {user && (
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              className="bg-brand-green text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post Comment
            </button>
          </div>
        )}
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-brand-green" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-brand-gray">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
