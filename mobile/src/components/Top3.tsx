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

const rankingStyles = [
  {
    medal: "🥇",
    bg: "bg-amber-50",
    border: "border-amber-200",
    medalBg: "bg-amber-100",
    accent: "bg-amber-400",
  },
  {
    medal: "🥈",
    bg: "bg-slate-50",
    border: "border-slate-200",
    medalBg: "bg-slate-100",
    accent: "bg-slate-400",
  },
  {
    medal: "🥉",
    bg: "bg-orange-50",
    border: "border-orange-200",
    medalBg: "bg-orange-100",
    accent: "bg-orange-400",
  },
];

export default function Top3({ items, weekLabel }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <View className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-5">
      <View className="flex-row items-center gap-2 mb-4">
        <Text className="text-2xl">🏆</Text>
        <Text className="text-xl font-bold text-neutral-900">
          Top 3 de la semaine
        </Text>
      </View>
      <View className="gap-3">
        {items.slice(0, 3).map((item, idx) => {
          const articleId = generateArticleId(item.url, item.title);
          const style = rankingStyles[idx];

          return (
            <View
              key={item.url}
              className={`${style.bg} ${style.border} border rounded-2xl overflow-hidden`}
            >
              <Pressable
                onPress={() => Linking.openURL(item.url)}
                className="p-4 active:opacity-80"
              >
                <View className="flex-row items-start gap-3">
                  {/* Medal badge */}
                  <View className={`${style.medalBg} w-12 h-12 rounded-xl items-center justify-center`}>
                    <Text className="text-2xl">{style.medal}</Text>
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Image
                        source={{ uri: faviconUrl(item.url, 32) }}
                        className="w-5 h-5 rounded"
                        resizeMode="contain"
                      />
                      {item.source && (
                        <Text className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                          {item.source}
                        </Text>
                      )}
                    </View>
                    <View className={`h-1 w-10 rounded-full ${style.accent} mb-2`} />
                    <Text className="text-base font-semibold text-neutral-900 leading-6" numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
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
    </View>
  );
}
