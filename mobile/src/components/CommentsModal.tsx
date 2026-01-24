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
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <View className="flex-1 pr-4">
            <Text className="text-xl font-bold text-gray-900">💬 Commentaires</Text>
            <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
              {currentArticle.articleTitle}
            </Text>
            <View className="flex-row items-center gap-4 mt-2">
              <Text className="text-xs text-gray-500">
                {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
              </Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setSortBy('recent')}
                  className={`px-2 py-1 rounded ${
                    sortBy === 'recent' ? 'bg-blue-100' : ''
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      sortBy === 'recent'
                        ? 'text-blue-700 font-semibold'
                        : 'text-gray-600'
                    }`}
                  >
                    Récents
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSortBy('popular')}
                  className={`px-2 py-1 rounded ${
                    sortBy === 'popular' ? 'bg-blue-100' : ''
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      sortBy === 'popular'
                        ? 'text-blue-700 font-semibold'
                        : 'text-gray-600'
                    }`}
                  >
                    Populaires
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
          <Pressable onPress={closeCommentsModal} className="p-2">
            <Text className="text-2xl text-gray-400">✕</Text>
          </Pressable>
        </View>

        {/* Comments List */}
        <ScrollView className="flex-1 p-4">
          {loading && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#1e293b" />
              <Text className="mt-2 text-gray-500">Chargement des commentaires...</Text>
            </View>
          )}

          {!loading && comments.length === 0 && (
            <View className="items-center py-8">
              <Text className="text-lg text-gray-500">Aucun commentaire pour le moment.</Text>
              <Text className="text-sm text-gray-400 mt-2">
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
        <View className="border-t border-gray-200 p-4 bg-gray-50">
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
            <Text className="text-center text-gray-500">
              Vous devez être connecté pour commenter.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
