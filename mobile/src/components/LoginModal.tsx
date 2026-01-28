import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

// Firebase Client IDs
const WEB_CLIENT_ID = '243729050286-niee9nmmdi10b5hi9se7i6p3l1l4c5eo.apps.googleusercontent.com';
const IOS_CLIENT_ID = '243729050286-br9p3ejmi768domm8ehqqi96ecejodoa.apps.googleusercontent.com';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID || undefined,
    scopes: ['profile', 'email'],
    extraParams: {
      prompt: 'select_account',
    },
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setIsLoading(true);
      setError(null);

      const { id_token, access_token } = response.params;
      const credential = id_token
        ? GoogleAuthProvider.credential(id_token)
        : GoogleAuthProvider.credential(null, access_token);

      signInWithCredential(auth, credential)
        .then(() => {
          closeLoginModal();
        })
        .catch((err) => {
          console.error('Error signing in:', err);
          setError('Erreur de connexion. Réessayez.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (response?.type === 'error') {
      console.error('Google auth error:', response.error);
      setError('Connexion annulée ou erreur.');
    }
  }, [response, closeLoginModal]);

  const handleGoogleSignIn = async () => {
    setError(null);
    if (IOS_CLIENT_ID) {
      // Clear any cached browser session first
      await WebBrowser.coolDownAsync();
      promptAsync({ showInRecents: true });
    } else {
      setError('iOS Client ID non configuré. Utilisez la connexion invité.');
    }
  };

  return (
    <Modal
      visible={isLoginModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={closeLoginModal}
    >
      <View className="flex-1 justify-center items-center bg-black/60">
        <View className="bg-white rounded-3xl p-6 w-[90%] max-w-sm shadow-lg">
          {/* Header with icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-indigo-100 rounded-2xl items-center justify-center mb-3">
              <Text className="text-3xl">🔐</Text>
            </View>
            <Text className="text-2xl font-bold text-neutral-900">
              Connexion
            </Text>
            <Text className="text-sm text-neutral-500 mt-1 text-center">
              Connectez-vous pour voter et commenter
            </Text>
          </View>

          {error && (
            <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          )}

          {/* Google Sign In - only if iOS Client ID is configured */}
          {IOS_CLIENT_ID ? (
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={!request || isLoading}
              className={`flex-row items-center justify-center gap-3 bg-white border-2 border-neutral-200 rounded-2xl py-4 px-4 mb-3 ${
                isLoading || !request ? 'opacity-50' : 'active:bg-neutral-50'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <>
                  <Text className="text-xl">G</Text>
                  <Text className="font-semibold text-neutral-700">
                    Continuer avec Google
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}

          <Pressable
            onPress={closeLoginModal}
            disabled={isLoading}
            className="mt-2 py-3 rounded-2xl active:bg-neutral-100"
          >
            <Text className="text-center text-neutral-400 font-medium">Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
