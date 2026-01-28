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
    <View className="gap-3">
      <Text className="text-lg font-bold text-neutral-900 px-1">
        Vidéos & Podcasts
      </Text>
      {items.map((item, idx) => {
        const dom = getDomain(item.url);
        const displaySource = (item.source || dom || "Source").trim();
        const isYoutube = item.source_type === "youtube";
        const articleId = generateArticleId(item.url, item.title);

        return (
          <View
            key={idx}
            className="bg-gradient-to-r from-neutral-50 to-slate-50 rounded-2xl border border-neutral-100 overflow-hidden"
          >
            <Pressable
              onPress={() => Linking.openURL(item.url)}
              className="flex-row items-start gap-3 p-4 active:opacity-80"
            >
              <View className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-neutral-100 shadow-sm">
                <Text className="text-lg">{isYoutube ? '▶️' : '🎙️'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
                  {displaySource}
                </Text>
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
  );
}
