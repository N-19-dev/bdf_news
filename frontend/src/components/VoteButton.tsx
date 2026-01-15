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
  score?: number;
}

export default function VoteButton({
  articleId,
  articleUrl,
  weekLabel,
  source,
  category,
  score,
}: VoteButtonProps) {
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [voteCounts, setVoteCounts] = useState({ upvotes: 0, downvotes: 0 });
  const [loading, setLoading] = useState(false);

  const { user, openLoginModal } = useAuth();

  useEffect(() => {
    fetchVotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, user]);

  const fetchVotes = async () => {
    try {
      const votesRef = collection(db, 'votes');
      const q = query(votesRef, where('article_id', '==', articleId));
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
      const voteDocId = `${user.uid}_${articleId}`;
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
          article_score: score || 0,
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
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition ${
          userVote === 1
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-600 hover:bg-green-50'
        } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        👍 {voteCounts.upvotes}
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition ${
          userVote === -1
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-600 hover:bg-red-50'
        } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        👎 {voteCounts.downvotes}
      </button>
      {!user && (
        <span className="text-xs text-gray-400 ml-2">Connectez-vous pour voter</span>
      )}
    </div>
  );
}
