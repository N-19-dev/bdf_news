import { View, Text } from "react-native";
import ArticleCard from "./ArticleCard";
import type { SectionItem } from "../lib/parse";

type Props = {
  title: string;
  items: SectionItem[];
  weekLabel?: string;
};

export default function SectionCard({ title, items, weekLabel }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <View className="bg-white rounded-2xl border border-neutral-200 p-4">
      <Text className="text-base font-bold text-neutral-900 mb-3">{title}</Text>
      <View className="gap-2">
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
