import { View, Text, Pressable, Image, Linking } from "react-native";
import type { TopItem } from "../lib/parse";
import { faviconUrl } from "../lib/parse";
import { generateArticleId } from "../lib/utils";
import VoteButton from "./VoteButton";
import CommentsButton from "./CommentsButton";

type Props = {
  items: TopItem[];
  weekLabel?: string;
};

const medals = ["🥇", "🥈", "🥉"];

export default function Top3({ items, weekLabel }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <View className="bg-white rounded-2xl border border-neutral-200 p-4">
      <Text className="text-lg font-bold text-neutral-900 mb-4">
        Top 3 de la semaine
      </Text>
      <View className="gap-3">
        {items.slice(0, 3).map((item, idx) => {
          const articleId = generateArticleId(item.url, item.title);

          return (
            <View key={item.url} className="bg-neutral-50 rounded-xl overflow-hidden">
              <Pressable
                onPress={() => Linking.openURL(item.url)}
                className="flex-row items-start gap-3 p-3 active:bg-neutral-100"
              >
                <Text className="text-2xl">{medals[idx]}</Text>
                <Image
                  source={{ uri: faviconUrl(item.url, 32) }}
                  className="w-6 h-6 rounded mt-1"
                  resizeMode="contain"
                />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-neutral-900 leading-5" numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.source && (
                    <Text className="text-xs text-neutral-500 mt-1">{item.source}</Text>
                  )}
                </View>
              </Pressable>
              {weekLabel && (
                <View className="flex-row items-center justify-between px-3 pb-3">
                  <VoteButton
                    articleId={articleId}
                    articleUrl={item.url}
                    weekLabel={weekLabel}
                    source={item.source}
                    category="top3"
                  />
                  <CommentsButton
                    articleId={articleId}
                    articleUrl={item.url}
                    articleTitle={item.title}
                    weekLabel={weekLabel}
                    category="top3"
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
