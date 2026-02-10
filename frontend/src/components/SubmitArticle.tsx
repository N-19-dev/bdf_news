import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../lib/AuthContext";

export default function SubmitArticle() {
  const { user, openLoginModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openLoginModal();
      return;
    }

    if (!url.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Try to fetch the page title
      let title: string | null = null;
      try {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        const html = await res.text();
        const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (match) {
          title = match[1].trim();
        }
      } catch {
        // Ignore fetch errors, title stays null
      }

      await addDoc(collection(db, "submissions"), {
        url: url.trim(),
        title,
        submitted_by: user.uid,
        submitted_by_name: user.displayName || "Anonyme",
        submitted_at: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
      });

      setSuccess(true);
      setUrl("");
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Error submitting article:", err);
      setError("Erreur lors de la soumission. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="text-center">
        <button
          onClick={() => {
            if (!user) {
              openLoginModal();
              return;
            }
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
        >
          <span>+</span>
          <span>Proposer un article</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900">Proposer un article</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-neutral-400 hover:text-neutral-600"
        >
          ✕
        </button>
      </div>

      {success ? (
        <div className="text-center py-4">
          <p className="text-green-600 font-medium">Article soumis !</p>
          <p className="text-sm text-neutral-500 mt-1">Il apparaitra dans le feed.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-neutral-700 mb-1">
              URL de l'article *
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded-lg font-medium text-white transition ${
              isSubmitting
                ? 'bg-neutral-400 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Envoi...' : 'Soumettre'}
          </button>
        </form>
      )}
    </div>
  );
}
