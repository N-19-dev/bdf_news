import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useComments } from '../lib/CommentsContext';

interface CommentsButtonProps {
  articleId: string;
  articleUrl: string;
  articleTitle: string;
  weekLabel: string;
  category: string;
  source: string;
}

export default function CommentsButton({
  articleId,
  articleUrl,
  articleTitle,
  weekLabel,
  category,
  source,
}: CommentsButtonProps) {
  const { openCommentsModal } = useComments();
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const commentsRef = collection(db, 'comments');
        const q = query(
          commentsRef,
          where('article_id', '==', articleId),
          where('week_label', '==', weekLabel)
        );
        const snapshot = await getDocs(q);
        setCommentCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching comment count:', error);
      }
    };

    fetchCount();
  }, [articleId, weekLabel]);

  const handlePress = () => {
    openCommentsModal(articleId, articleUrl, articleTitle, weekLabel, category, source);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-1 px-2 py-1 rounded bg-gray-100 active:bg-gray-200"
    >
      <Text className="text-gray-600">💬 {commentCount}</Text>
    </Pressable>
  );
}
