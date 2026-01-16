import { useState } from 'react';
import { doc, updateDoc, deleteDoc, setDoc, deleteDoc as deleteDocFirestore, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CommentData } from '../types/comments';
import CommentInput from './CommentInput';

interface CommentProps {
  comment: CommentData;
  replies: CommentData[];
  onReply: (parentId: string) => void;
  currentUserId?: string;
  depth: number;
}

const MAX_DEPTH = 3;
const EDIT_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes in milliseconds

export default function Comment({ comment, replies, onReply, currentUserId, depth }: CommentProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(comment.likes);

  const isOwnComment = currentUserId === comment.user_id;
  const createdAt = comment.created_at.toDate();
  const now = new Date();
  const canEdit = isOwnComment && (now.getTime() - createdAt.getTime()) < EDIT_TIME_LIMIT;

  const formatDate = (date: Date) => {
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleLike = async () => {
    if (!currentUserId) return;

    const likeId = `${currentUserId}_${comment.id}`;
    const likeRef = doc(db, 'comment_likes', likeId);
    const commentRef = doc(db, 'comments', comment.id);

    try {
      if (isLiked) {
        // Unlike
        await deleteDocFirestore(likeRef);
        await updateDoc(commentRef, {
          likes: Math.max(0, comment.likes - 1)
        });
        setIsLiked(false);
        setLocalLikes((prev) => Math.max(0, prev - 1));
      } else {
        // Like
        await setDoc(likeRef, {
          user_id: currentUserId,
          comment_id: comment.id,
          liked_at: Timestamp.now()
        });
        await updateDoc(commentRef, {
          likes: comment.likes + 1
        });
        setIsLiked(true);
        setLocalLikes((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      const commentRef = doc(db, 'comments', comment.id);
      await updateDoc(commentRef, {
        content: editContent.trim(),
        updated_at: Timestamp.now(),
        is_edited: true
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Erreur lors de la modification du commentaire.');
    }
  };

  const deleteCommentAndReplies = async (commentId: string): Promise<void> => {
    // Find all replies to this comment
    const repliesQuery = query(
      collection(db, 'comments'),
      where('parent_id', '==', commentId)
    );

    const repliesSnapshot = await getDocs(repliesQuery);

    // Recursively delete all replies first
    const deletePromises = repliesSnapshot.docs.map(async (replyDoc) => {
      await deleteCommentAndReplies(replyDoc.id);
    });

    await Promise.all(deletePromises);

    // Delete the comment itself
    const commentRef = doc(db, 'comments', commentId);
    await deleteDoc(commentRef);

    // Also delete associated likes
    const likesQuery = query(
      collection(db, 'comment_likes'),
      where('comment_id', '==', commentId)
    );

    const likesSnapshot = await getDocs(likesQuery);
    const likeDeletions = likesSnapshot.docs.map((likeDoc) => deleteDoc(likeDoc.ref));
    await Promise.all(likeDeletions);
  };

  const handleDelete = async () => {
    const hasReplies = replies && replies.length > 0;
    const confirmMessage = hasReplies
      ? 'Ce commentaire a des réponses. Supprimer ce commentaire supprimera aussi toutes ses réponses. Êtes-vous sûr ?'
      : 'Êtes-vous sûr de vouloir supprimer ce commentaire ?';

    if (!confirm(confirmMessage)) return;

    try {
      await deleteCommentAndReplies(comment.id);
    } catch (error) {
      console.error('Error deleting comment and replies:', error);
      alert('Erreur lors de la suppression du commentaire.');
    }
  };

  const handleReplyClick = () => {
    setShowReplyInput(!showReplyInput);
    if (!showReplyInput) {
      onReply(comment.id);
    }
  };

  const handleReplyAdded = () => {
    setShowReplyInput(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : ''}`}>
      <div className="flex gap-3">
        {/* Comment Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">{comment.user_name}</span>
            <span className="text-xs text-gray-500">{formatDate(createdAt)}</span>
            {comment.is_edited && <span className="text-xs text-gray-400">(modifié)</span>}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mb-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={2000}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap mb-2">{comment.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 text-xs">
            {/* Like button */}
            {currentUserId && (
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 ${
                  isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <span>{isLiked ? '❤️' : '🤍'}</span>
                <span>{localLikes > 0 && localLikes}</span>
              </button>
            )}

            {/* Reply button */}
            {depth < MAX_DEPTH && currentUserId && (
              <button
                onClick={handleReplyClick}
                className="text-gray-600 hover:text-blue-600"
              >
                Répondre
              </button>
            )}

            {/* Edit button */}
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-600 hover:text-blue-600"
              >
                Modifier
              </button>
            )}

            {/* Delete button */}
            {isOwnComment && (
              <button
                onClick={handleDelete}
                className="text-gray-600 hover:text-red-600"
              >
                Supprimer
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && currentUserId && (
            <div className="mt-3">
              <CommentInput
                articleId={comment.article_id}
                articleUrl={comment.article_url}
                articleTitle={comment.article_title}
                weekLabel={comment.week_label}
                category={comment.article_category}
                source={comment.article_source}
                parentId={comment.id}
                placeholder={`Répondre à ${comment.user_name}...`}
                onCommentAdded={handleReplyAdded}
              />
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && depth < MAX_DEPTH && (
            <div className="mt-4 space-y-4">
              {replies.map((reply) => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  onReply={onReply}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
