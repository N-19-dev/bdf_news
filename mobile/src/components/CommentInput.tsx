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
    <View className="gap-2">
      <View className="relative">
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={placeholder}
          multiline
          maxLength={MAX_LENGTH}
          editable={!isSubmitting}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[80px] bg-white"
          placeholderTextColor="#9CA3AF"
        />
        <Text className="absolute bottom-2 right-2 text-xs text-gray-400">
          {charCount}/{MAX_LENGTH}
        </Text>
      </View>

      {error && <Text className="text-xs text-red-600">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`px-4 py-2 rounded-lg self-end ${
          isValid && !isSubmitting ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text
            className={`text-sm font-semibold ${
              isValid ? 'text-white' : 'text-gray-500'
            }`}
          >
            Envoyer
          </Text>
        )}
      </Pressable>
    </View>
  );
}
