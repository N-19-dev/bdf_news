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
    <View className="bg-gradient-to-r from-neutral-50 to-slate-50 rounded-2xl border border-neutral-100 overflow-hidden">
      <Pressable
        onPress={handlePress}
        className="flex-row items-start gap-3 p-4 active:opacity-80"
      >
        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-neutral-100 shadow-sm">
          <Image
            source={{ uri: faviconUrl(url, 32) }}
            className="w-6 h-6 rounded"
            resizeMode="contain"
          />
        </View>
        <View className="flex-1">
          {source && (
            <Text className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
              {source}
            </Text>
          )}
          <Text className="text-base font-semibold text-neutral-900 leading-6" numberOfLines={2}>
            {title}
          </Text>
        </View>
      </Pressable>
      {weekLabel && (
        <View className="flex-row items-center justify-between px-4 pb-4 pt-1">
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
