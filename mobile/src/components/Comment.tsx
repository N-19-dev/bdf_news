import { View, Text, Image, Pressable } from 'react-native';
import type { CommentData } from '../types/comments';

interface CommentProps {
  comment: CommentData;
  replies?: CommentData[];
  onReply?: (parentId: string) => void;
  currentUserId?: string;
  depth?: number;
}

export default function Comment({
  comment,
  replies = [],
  onReply,
  depth = 0,
}: CommentProps) {
  const formatDate = (timestamp: { toDate: () => Date }) => {
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <View className={`${depth > 0 ? 'ml-4 border-l-2 border-indigo-200 pl-3' : ''}`}>
      <View className="bg-white rounded-2xl p-4 border border-neutral-100">
        <View className="flex-row items-start gap-3">
          {comment.user_photo ? (
            <Image
              source={{ uri: comment.user_photo }}
              className="w-10 h-10 rounded-xl"
            />
          ) : (
            <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center">
              <Text className="text-indigo-600 text-base font-bold">
                {comment.user_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-2">
              <Text className="text-sm font-bold text-neutral-900">
                {comment.user_name}
              </Text>
              <Text className="text-xs text-neutral-400">
                {formatDate(comment.created_at)}
              </Text>
              {comment.is_edited && (
                <Text className="text-xs text-neutral-400 italic">(modifié)</Text>
              )}
            </View>

            <Text className="text-sm text-neutral-700 mt-2 leading-5">{comment.content}</Text>

            <View className="flex-row items-center gap-4 mt-3">
              <View className="flex-row items-center gap-1 bg-neutral-100 px-2 py-1 rounded-lg">
                <Text className="text-xs">❤️</Text>
                <Text className="text-xs text-neutral-600 font-medium">{comment.likes}</Text>
              </View>

              {onReply && depth < 2 && (
                <Pressable
                  onPress={() => onReply(comment.id)}
                  className="px-2 py-1 rounded-lg active:bg-indigo-50"
                >
                  <Text className="text-xs text-indigo-600 font-semibold">Répondre</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Replies */}
      {replies.length > 0 && (
        <View className="mt-3 gap-3">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}
