import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

interface CommentInputProps {
  articleId: string;
  articleUrl: string;
  articleTitle: string;
  weekLabel: string;
  category: string;
  source: string;
  parentId?: string | null;
  placeholder?: string;
  onCommentAdded?: () => void;
}

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

export default function CommentInput({
  articleId,
  articleUrl,
  articleTitle,
  weekLabel,
  category,
  source,
  parentId = null,
  placeholder = 'Écrire un commentaire...',
  onCommentAdded,
}: CommentInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!user) {
      setError('Vous devez être connecté pour commenter.');
      return;
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length < MIN_LENGTH) {
      setError(`Le commentaire doit contenir au moins ${MIN_LENGTH} caractères.`);
      return;
    }

    if (trimmedContent.length > MAX_LENGTH) {
      setError(`Le commentaire ne doit pas dépasser ${MAX_LENGTH} caractères.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const commentsRef = collection(db, 'comments');

      await addDoc(commentsRef, {
        user_id: user.uid,
        user_name: user.displayName || 'Utilisateur anonyme',
        user_photo: user.photoURL || '',
        article_id: articleId,
        article_url: articleUrl,
        article_title: articleTitle,
        parent_id: parentId,
        content: trimmedContent,
        week_label: weekLabel,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        is_edited: false,
        article_category: category,
        article_source: source,
        likes: 0,
      });

      setContent('');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Erreur lors de l\'ajout du commentaire. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!user) {
    return null;
  }

  const charCount = content.length;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
          maxLength={MAX_LENGTH}
          disabled={isSubmitting}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {charCount}/{MAX_LENGTH}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Cmd/Ctrl + Entrée pour envoyer
        </p>
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isValid && !isSubmitting
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}
