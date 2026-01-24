import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';

interface VoteButtonProps {
  articleId: string;
  articleUrl: string;
  weekLabel: string;
  source?: string;
  category?: string;
}

export default function VoteButton({
  articleId,
  articleUrl,
  weekLabel,
  source,
  category,
}: VoteButtonProps) {
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [voteCounts, setVoteCounts] = useState({ upvotes: 0, downvotes: 0 });
  const [loading, setLoading] = useState(false);

  const { user, openLoginModal } = useAuth();

  useEffect(() => {
    fetchVotes();
  }, [articleId, weekLabel, user]);

  const fetchVotes = async () => {
    try {
      const votesRef = collection(db, 'votes');
      const q = query(
        votesRef,
        where('article_id', '==', articleId),
        where('week_label', '==', weekLabel)
      );
      const snapshot = await getDocs(q);

      let upvotes = 0;
      let downvotes = 0;
      let userVoteValue: 1 | -1 | null = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.vote_value === 1) upvotes++;
        if (data.vote_value === -1) downvotes++;

        if (user && data.user_id === user.uid) {
          userVoteValue = data.vote_value;
        }
      });

      setVoteCounts({ upvotes, downvotes });
      setUserVote(userVoteValue);
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleVote = async (voteValue: 1 | -1) => {
    if (!user) {
      openLoginModal();
      return;
    }

    setLoading(true);

    try {
      const voteDocId = `${user.uid}_${articleId}_${weekLabel}`;
      const voteRef = doc(db, 'votes', voteDocId);

      if (userVote === voteValue) {
        await deleteDoc(voteRef);
        setUserVote(null);
        setVoteCounts((prev) => ({
          upvotes: prev.upvotes - (voteValue === 1 ? 1 : 0),
          downvotes: prev.downvotes - (voteValue === -1 ? 1 : 0),
        }));
      } else {
        await setDoc(voteRef, {
          user_id: user.uid,
          article_id: articleId,
          article_url: articleUrl,
          vote_value: voteValue,
          week_label: weekLabel,
          voted_at: new Date(),
          article_source: source || '',
          article_category: category || '',
        });

        const prevVote = userVote;
        setUserVote(voteValue);
        setVoteCounts((prev) => ({
          upvotes: prev.upvotes + (voteValue === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0),
          downvotes: prev.downvotes + (voteValue === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0),
        }));
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={() => handleVote(1)}
        disabled={loading}
        className={`flex-row items-center gap-1 px-2 py-1 rounded ${
          userVote === 1 ? 'bg-green-100' : 'bg-gray-100'
        } ${loading ? 'opacity-50' : ''}`}
      >
        <Text className={userVote === 1 ? 'text-green-700' : 'text-gray-600'}>
          👍 {voteCounts.upvotes}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => handleVote(-1)}
        disabled={loading}
        className={`flex-row items-center gap-1 px-2 py-1 rounded ${
          userVote === -1 ? 'bg-red-100' : 'bg-gray-100'
        } ${loading ? 'opacity-50' : ''}`}
      >
        <Text className={userVote === -1 ? 'text-red-700' : 'text-gray-600'}>
          👎 {voteCounts.downvotes}
        </Text>
      </Pressable>
    </View>
  );
}
