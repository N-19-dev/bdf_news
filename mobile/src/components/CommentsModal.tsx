import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Modal, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useComments } from '../lib/CommentsContext';
import { useAuth } from '../lib/AuthContext';
import type { CommentData } from '../types/comments';
import Comment from './Comment';
import CommentInput from './CommentInput';

type SortOption = 'recent' | 'popular';

export default function CommentsModal() {
  const { isCommentsModalOpen, currentArticle, closeCommentsModal } = useComments();
  const { user } = useAuth();
  const [rawComments, setRawComments] = useState<CommentData[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentArticle) return;

    setLoading(true);
    const commentsRef = collection(db, 'comments');

    const q = query(
      commentsRef,
      where('article_id', '==', currentArticle.articleId),
      where('week_label', '==', currentArticle.weekLabel),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData: CommentData[] = [];
        snapshot.forEach((doc) => {
          commentsData.push({ id: doc.id, ...doc.data() } as CommentData);
        });
        setRawComments(commentsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching comments:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentArticle]);

  const comments = useMemo(() => {
    const sorted = [...rawComments];

    if (sortBy === 'recent') {
      sorted.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
    } else if (sortBy === 'popular') {
      sorted.sort((a, b) => b.likes - a.likes);
    }

    return sorted;
  }, [rawComments, sortBy]);

  const handleReply = useCallback((parentId: string) => {
    setReplyToId(parentId);
  }, []);

  const handleCommentAdded = useCallback(() => {
    setReplyToId(null);
  }, []);

  if (!isCommentsModalOpen || !currentArticle) return null;

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const commentsByParent = comments.reduce((acc, comment) => {
    if (comment.parent_id) {
      if (!acc[comment.parent_id]) acc[comment.parent_id] = [];
      acc[comment.parent_id].push(comment);
    }
    return acc;
  }, {} as Record<string, CommentData[]>);

  return (
    <Modal
      visible={isCommentsModalOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeCommentsModal}
    >
      <View className="flex-1 bg-neutral-50">
        {/* Header */}
        <View className="bg-indigo-600 px-5 py-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-8 h-8 bg-white/20 rounded-lg items-center justify-center">
                  <Text className="text-lg">💬</Text>
                </View>
                <Text className="text-xl font-bold text-white">Commentaires</Text>
              </View>
              <Text className="text-sm text-indigo-100" numberOfLines={2}>
                {currentArticle.articleTitle}
              </Text>
            </View>
            <Pressable
              onPress={closeCommentsModal}
              className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center"
            >
              <Text className="text-xl text-white">✕</Text>
            </Pressable>
          </View>

          {/* Sort options */}
          <View className="flex-row items-center gap-4 mt-4">
            <Text className="text-sm text-indigo-200">
              {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setSortBy('recent')}
                className={`px-3 py-1.5 rounded-xl ${
                  sortBy === 'recent' ? 'bg-white/20' : ''
                }`}
              >
                <Text
                  className={`text-sm ${
                    sortBy === 'recent'
                      ? 'text-white font-semibold'
                      : 'text-indigo-200'
                  }`}
                >
                  Récents
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSortBy('popular')}
                className={`px-3 py-1.5 rounded-xl ${
                  sortBy === 'popular' ? 'bg-white/20' : ''
                }`}
              >
                <Text
                  className={`text-sm ${
                    sortBy === 'popular'
                      ? 'text-white font-semibold'
                      : 'text-indigo-200'
                  }`}
                >
                  Populaires
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Comments List */}
        <ScrollView className="flex-1 p-4">
          {loading && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text className="mt-3 text-neutral-500">Chargement des commentaires...</Text>
            </View>
          )}

          {!loading && comments.length === 0 && (
            <View className="items-center py-12">
              <View className="w-16 h-16 bg-indigo-100 rounded-2xl items-center justify-center mb-4">
                <Text className="text-3xl">💭</Text>
              </View>
              <Text className="text-lg font-semibold text-neutral-700">Aucun commentaire</Text>
              <Text className="text-sm text-neutral-500 mt-1 text-center">
                Soyez le premier à commenter cet article !
              </Text>
            </View>
          )}

          {!loading && (
            <View className="gap-4">
              {topLevelComments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  replies={commentsByParent[comment.id] || []}
                  onReply={handleReply}
                  currentUserId={user?.uid}
                  depth={0}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Comment Input */}
        <View className="border-t border-neutral-200 p-4 bg-white">
          {user ? (
            <CommentInput
              articleId={currentArticle.articleId}
              articleUrl={currentArticle.articleUrl}
              articleTitle={currentArticle.articleTitle}
              weekLabel={currentArticle.weekLabel}
              category={currentArticle.category}
              source={currentArticle.source}
              parentId={replyToId}
              placeholder={
                replyToId ? 'Répondre au commentaire...' : 'Écrire un commentaire...'
              }
              onCommentAdded={handleCommentAdded}
            />
          ) : (
            <View className="items-center py-2">
              <Text className="text-center text-neutral-500">
                Connectez-vous pour commenter
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
