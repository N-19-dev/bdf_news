import { createContext, useContext, useState, ReactNode } from 'react';

interface ArticleInfo {
  articleId: string;
  articleUrl: string;
  articleTitle: string;
  weekLabel: string;
  category: string;
  source: string;
}

interface CommentsContextType {
  isCommentsModalOpen: boolean;
  currentArticle: ArticleInfo | null;
  openCommentsModal: (
    articleId: string,
    articleUrl: string,
    articleTitle: string,
    weekLabel: string,
    category: string,
    source: string
  ) => void;
  closeCommentsModal: () => void;
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

export function CommentsProvider({ children }: { children: ReactNode }) {
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<ArticleInfo | null>(null);

  const openCommentsModal = (
    articleId: string,
    articleUrl: string,
    articleTitle: string,
    weekLabel: string,
    category: string,
    source: string
  ) => {
    setCurrentArticle({
      articleId,
      articleUrl,
      articleTitle,
      weekLabel,
      category,
      source,
    });
    setIsCommentsModalOpen(true);
  };

  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false);
    setTimeout(() => setCurrentArticle(null), 300);
  };

  return (
    <CommentsContext.Provider
      value={{
        isCommentsModalOpen,
        currentArticle,
        openCommentsModal,
        closeCommentsModal,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  const context = useContext(CommentsContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
}
