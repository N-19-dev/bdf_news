import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CommentsCountProps {
  articleId: string;
  weekLabel: string;
}

export default function CommentsCount({ articleId, weekLabel }: CommentsCountProps) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('article_id', '==', articleId),
      where('week_label', '==', weekLabel)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching comment count:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [articleId, weekLabel]);

  if (loading) {
    return <span className="text-gray-400">...</span>;
  }

  if (count === 0) {
    return <span className="text-gray-500">0</span>;
  }

  return <span className="font-semibold text-gray-700">{count}</span>;
}
