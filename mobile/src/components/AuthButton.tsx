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
      <Pressable
        onPress={handleLogout}
        className="flex-row items-center gap-2 bg-white/20 rounded-xl px-3 py-2 active:bg-white/30"
      >
        {user.photoURL ? (
          <Image
            source={{ uri: user.photoURL }}
            className="w-7 h-7 rounded-full border-2 border-white/50"
          />
        ) : (
          <View className="w-7 h-7 rounded-full bg-white/30 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {user.email?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={openLoginModal}
      className="bg-white rounded-xl px-4 py-2 active:bg-indigo-50"
    >
      <Text className="text-sm text-indigo-600 font-semibold">Connexion</Text>
    </Pressable>
  );
}
