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
            className="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
          >
            <Pressable
              onPress={() => Linking.openURL(item.url)}
              className="p-4 active:bg-neutral-50"
            >
              <View className="flex-row items-center gap-2 mb-2">
                <Image
                  source={{ uri: faviconUrl(item.url, 32) }}
                  className="w-5 h-5 rounded"
                  resizeMode="contain"
                />
                {item.source && (
                  <Text className="text-xs text-neutral-500">
                    {item.source}
                  </Text>
                )}
              </View>
              <Text className="text-base font-medium text-neutral-900 leading-6">
                {item.title}
              </Text>
            </Pressable>

            {weekLabel && (
              <View className="flex-row items-center justify-between px-4 pb-4">
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
