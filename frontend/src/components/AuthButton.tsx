import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../lib/AuthContext';

export default function AuthButton() {
  const { user, loading, openLoginModal } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          👤 {user.displayName?.split(' ')[0] || 'Utilisateur'}
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700 transition underline"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={openLoginModal}
      className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
    >
      Se connecter
    </button>
  );
}
