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
    <View className={`${depth > 0 ? 'ml-4 border-l-2 border-gray-200 pl-3' : ''}`}>
      <View className="flex-row items-start gap-3">
        {comment.user_photo ? (
          <Image
            source={{ uri: comment.user_photo }}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center">
            <Text className="text-gray-600 text-sm font-medium">
              {comment.user_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-gray-900">
              {comment.user_name}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDate(comment.created_at)}
            </Text>
            {comment.is_edited && (
              <Text className="text-xs text-gray-400">(modifié)</Text>
            )}
          </View>

          <Text className="text-sm text-gray-700 mt-1">{comment.content}</Text>

          <View className="flex-row items-center gap-4 mt-2">
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-gray-500">❤️ {comment.likes}</Text>
            </View>

            {onReply && depth < 2 && (
              <Pressable onPress={() => onReply(comment.id)}>
                <Text className="text-xs text-blue-600 font-medium">Répondre</Text>
              </Pressable>
            )}
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
