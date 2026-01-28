import { View, Text } from "react-native";
import ArticleCard from "./ArticleCard";
import type { SectionItem } from "../lib/parse";

type Props = {
  title: string;
  items: SectionItem[];
  weekLabel?: string;
};

// Extract emoji from title if present
function parseTitle(title: string): { emoji: string; text: string } {
  const emojiMatch = title.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u);
  if (emojiMatch) {
    return {
      emoji: emojiMatch[1],
      text: title.slice(emojiMatch[0].length).trim(),
    };
  }
  return { emoji: "📁", text: title };
}

export default function SectionCard({ title, items, weekLabel }: Props) {
  if (!items || items.length === 0) return null;

  const { emoji, text } = parseTitle(title);

  return (
    <View className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-5">
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-10 h-10 bg-indigo-100 rounded-xl items-center justify-center">
          <Text className="text-xl">{emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-neutral-900">{text}</Text>
          <Text className="text-xs text-neutral-500">{items.length} article{items.length > 1 ? 's' : ''}</Text>
        </View>
      </View>
      <View className="gap-3">
        {items.map((item) => (
          <ArticleCard
            key={item.url}
            title={item.title}
            url={item.url}
            source={item.source}
            weekLabel={weekLabel}
            category={title}
          />
        ))}
      </View>
    </View>
  );
}
