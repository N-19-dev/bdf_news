import { View, Text, Pressable, Image } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function AuthButton() {
  const { user, loading, openLoginModal } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return null;
  }

  if (user) {
    return (
      <View className="flex-row items-center gap-2">
        {user.photoURL && (
          <Image
            source={{ uri: user.photoURL }}
            className="w-8 h-8 rounded-full"
          />
        )}
        <Pressable
          onPress={handleLogout}
          className="bg-neutral-200 rounded-lg px-3 py-1.5 active:bg-neutral-300"
        >
          <Text className="text-sm text-neutral-700">Déconnexion</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={openLoginModal}
      className="bg-slate-700 rounded-lg px-3 py-1.5 active:bg-slate-600"
    >
      <Text className="text-sm text-white font-medium">Connexion</Text>
    </Pressable>
  );
}
