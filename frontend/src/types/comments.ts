import type { Timestamp } from 'firebase/firestore';

export type CommentData = {
  id: string;
  user_id: string;
  user_name: string;
  user_photo?: string;
  article_id: string;
  article_url: string;
  article_title: string;
  parent_id: string | null;
  content: string;
  week_label: string;
  created_at: Timestamp;
  updated_at?: Timestamp;
  is_edited: boolean;
  article_category: string;
  article_source: string;
  likes: number;
};
