import { useState, useEffect } from 'react';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Remove vote if clicking same button
        await deleteDoc(voteRef);
        setUserVote(null);
        setVoteCounts((prev) => ({
          upvotes: prev.upvotes - (voteValue === 1 ? 1 : 0),
          downvotes: prev.downvotes - (voteValue === -1 ? 1 : 0),
        }));
      } else {
        // Add or update vote
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

  const score = voteCounts.upvotes - voteCounts.downvotes;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`p-1 rounded transition ${
          userVote === 1
            ? 'text-green-600'
            : 'text-gray-400 hover:text-green-600'
        } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        ▲
      </button>
      <span className={`text-sm font-medium min-w-[20px] text-center ${
        score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-500'
      }`}>
        {score}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`p-1 rounded transition ${
          userVote === -1
            ? 'text-red-600'
            : 'text-gray-400 hover:text-red-600'
        } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        ▼
      </button>
    </div>
  );
}
