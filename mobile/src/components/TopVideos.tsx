import { View, Text, Pressable, Linking } from "react-native";
import type { VideoItem } from "../lib/parse";
import { getDomain } from "../lib/parse";
import { generateArticleId } from "../lib/utils";
import VoteButton from "./VoteButton";
import CommentsButton from "./CommentsButton";

type Props = {
  items: VideoItem[];
  weekLabel?: string;
};

export default function TopVideos({ items, weekLabel }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <View className="bg-white rounded-2xl border border-neutral-200 p-4">
      <Text className="text-lg font-bold text-neutral-900 mb-4">
        🎥 Top 3 Vidéos / Podcasts
      </Text>
      <View className="gap-3">
        {items.map((item, idx) => {
          const dom = getDomain(item.url);
          const displaySource = (item.source || dom || "Source").trim();
          const emoji = item.source_type === "youtube" ? "🎥" : "🎙️";
          const articleId = generateArticleId(item.url, item.title);

          return (
            <View key={idx} className="bg-neutral-50 rounded-xl overflow-hidden">
              <Pressable
                onPress={() => Linking.openURL(item.url)}
                className="p-3 active:bg-neutral-100"
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-lg">{emoji}</Text>
                  <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    {displaySource}
                  </Text>
                </View>
                <View className="h-1 w-12 rounded-full bg-purple-300 mb-2" />
                <Text className="text-sm font-semibold text-neutral-900 leading-5" numberOfLines={3}>
                  {item.title}
                </Text>
              </Pressable>
              {weekLabel && (
                <View className="flex-row items-center justify-between px-3 pb-3">
                  <VoteButton
                    articleId={articleId}
                    articleUrl={item.url}
                    weekLabel={weekLabel}
                    source={item.source}
                    category={item.source_type || 'video'}
                  />
                  <CommentsButton
                    articleId={articleId}
                    articleUrl={item.url}
                    articleTitle={item.title}
                    weekLabel={weekLabel}
                    category={item.source_type || 'video'}
                    source={item.source || ''}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
