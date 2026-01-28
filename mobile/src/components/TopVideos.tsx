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
    <View className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-5">
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-10 h-10 bg-violet-100 rounded-xl items-center justify-center">
          <Text className="text-xl">🎬</Text>
        </View>
        <View>
          <Text className="text-xl font-bold text-neutral-900">
            Vidéos & Podcasts
          </Text>
          <Text className="text-xs text-neutral-500">Top 3 de la semaine</Text>
        </View>
      </View>
      <View className="gap-3">
        {items.map((item, idx) => {
          const dom = getDomain(item.url);
          const displaySource = (item.source || dom || "Source").trim();
          const isYoutube = item.source_type === "youtube";
          const articleId = generateArticleId(item.url, item.title);

          return (
            <View
              key={idx}
              className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl overflow-hidden"
            >
              <Pressable
                onPress={() => Linking.openURL(item.url)}
                className="p-4 active:opacity-80"
              >
                <View className="flex-row items-start gap-3">
                  {/* Media type icon */}
                  <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                    isYoutube ? 'bg-red-100' : 'bg-purple-100'
                  }`}>
                    <Text className="text-2xl">{isYoutube ? '▶️' : '🎙️'}</Text>
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className={`px-2 py-0.5 rounded-full ${
                        isYoutube ? 'bg-red-100' : 'bg-purple-100'
                      }`}>
                        <Text className={`text-xs font-bold uppercase ${
                          isYoutube ? 'text-red-600' : 'text-purple-600'
                        }`}>
                          {isYoutube ? 'YouTube' : 'Podcast'}
                        </Text>
                      </View>
                      <Text className="text-xs text-neutral-500">
                        {displaySource}
                      </Text>
                    </View>
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
