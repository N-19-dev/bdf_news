import { View, Text, Pressable, Image, Linking } from "react-native";
import { faviconUrl } from "../lib/parse";
import { generateArticleId } from "../lib/utils";
import VoteButton from "./VoteButton";
import CommentsButton from "./CommentsButton";

type Props = {
  title: string;
  url: string;
  source?: string;
  weekLabel?: string;
  category?: string;
};

export default function ArticleCard({ title, url, source, weekLabel, category }: Props) {
  const handlePress = () => {
    Linking.openURL(url);
  };

  const articleId = generateArticleId(url, title);

  return (
    <View className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <Pressable
        onPress={handlePress}
        className="flex-row items-start gap-3 p-3 active:bg-neutral-50"
      >
        <Image
          source={{ uri: faviconUrl(url, 32) }}
          className="w-6 h-6 rounded"
          resizeMode="contain"
        />
        <View className="flex-1">
          <Text className="text-sm font-medium text-neutral-900 leading-5" numberOfLines={2}>
            {title}
          </Text>
          {source && (
            <Text className="text-xs text-neutral-500 mt-1">{source}</Text>
          )}
        </View>
      </Pressable>
      {weekLabel && (
        <View className="flex-row items-center justify-between px-3 pb-3">
          <VoteButton
            articleId={articleId}
            articleUrl={url}
            weekLabel={weekLabel}
            source={source}
            category={category}
          />
          <CommentsButton
            articleId={articleId}
            articleUrl={url}
            articleTitle={title}
            weekLabel={weekLabel}
            category={category || ''}
            source={source || ''}
          />
        </View>
      )}
    </View>
  );
}
