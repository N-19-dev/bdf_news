import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
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
      setError("Erreur lors de l'ajout du commentaire. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  const charCount = content.length;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  return (
    <View className="gap-3">
      <View className="relative">
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={placeholder}
          multiline
          maxLength={MAX_LENGTH}
          editable={!isSubmitting}
          className="w-full p-4 border-2 border-neutral-200 rounded-2xl text-base min-h-[100px] bg-neutral-50"
          placeholderTextColor="#9CA3AF"
        />
        <Text className="absolute bottom-3 right-3 text-xs text-neutral-400">
          {charCount}/{MAX_LENGTH}
        </Text>
      </View>

      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-2">
          <Text className="text-xs text-red-600">{error}</Text>
        </View>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`px-5 py-3 rounded-xl self-end ${
          isValid && !isSubmitting ? 'bg-indigo-600 active:bg-indigo-700' : 'bg-neutral-200'
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text
            className={`text-sm font-semibold ${
              isValid ? 'text-white' : 'text-neutral-400'
            }`}
          >
            Envoyer
          </Text>
        )}
      </Pressable>
    </View>
  );
}
