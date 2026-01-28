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

export default function Top3({ items, weekLabel }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <View className="gap-3">
      <Text className="text-lg font-bold text-neutral-900 px-1">
        Top 3 de la semaine
      </Text>
      {items.slice(0, 3).map((item) => {
        const articleId = generateArticleId(item.url, item.title);

        return (
          <View
            key={item.url}
            className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
          >
            <Pressable
              onPress={() => Linking.openURL(item.url)}
              className="flex-row items-start gap-3 p-4 active:bg-neutral-50"
            >
              <Image
                source={{ uri: faviconUrl(item.url, 32) }}
                className="w-8 h-8 rounded-lg"
                resizeMode="contain"
              />
              <View className="flex-1">
                {item.source && (
                  <Text className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
                    {item.source}
                  </Text>
                )}
                <Text className="text-base font-semibold text-neutral-900 leading-6" numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </Pressable>

            {weekLabel && (
              <View className="flex-row items-center justify-between px-4 pb-4 pt-1">
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
  );
}
