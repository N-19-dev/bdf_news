import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

type VoteCounts = Record<string, number>; // articleId -> netVotes

export function useWeekVotes(weekLabel: string | undefined) {
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weekLabel) {
      setLoading(false);
      return;
    }

    const votesRef = collection(db, 'votes');
    const q = query(votesRef, where('week_label', '==', weekLabel));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const counts: VoteCounts = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          const articleId = data.article_id;
          const voteValue = data.vote_value || 0;

          if (!counts[articleId]) {
            counts[articleId] = 0;
          }
          counts[articleId] += voteValue;
        });

        setVoteCounts(counts);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching week votes:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [weekLabel]);

  const getVoteCount = (articleId: string) => voteCounts[articleId] || 0;

  return { voteCounts, getVoteCount, loading };
}
