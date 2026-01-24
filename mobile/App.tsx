import "./global.css";
import { useEffect, useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import Top3 from "./src/components/Top3";
import TopVideos from "./src/components/TopVideos";
import SectionCard from "./src/components/SectionCard";
import AuthButton from "./src/components/AuthButton";
import LoginModal from "./src/components/LoginModal";
import CommentsModal from "./src/components/CommentsModal";
import WeekPicker from "./src/components/WeekPicker";
import { AuthProvider } from "./src/lib/AuthContext";
import { CommentsProvider } from "./src/lib/CommentsContext";
import {
  loadWeeksIndex,
  loadLatestWeek,
  loadWeekSummary,
  type WeekMeta,
  type TopItem,
  type VideoItem,
  type SummarySection,
} from "./src/lib/parse";

type WeekData = {
  overview: string;
  top3: TopItem[];
  topVideos: VideoItem[];
  sections: SummarySection[];
};

function AppContent() {
  const [weeks, setWeeks] = useState<WeekMeta[]>([]);
  const [currentWeek, setCurrentWeek] = useState<WeekMeta | null>(null);
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullSelection, setShowFullSelection] = useState(false);

  const loadData = async () => {
    try {
      const ws = await loadWeeksIndex();
      setWeeks(ws);
      const latest = ws[0] || (await loadLatestWeek());
      setCurrentWeek(latest);
      const weekData = await loadWeekSummary(latest);
      setData(weekData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleWeekChange = async (week: WeekMeta) => {
    setLoading(true);
    try {
      setCurrentWeek(week);
      const weekData = await loadWeekSummary(week);
      setData(weekData);
      setError(null);
      setShowFullSelection(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const totalArticles = useMemo(() => {
    if (!data) return 0;
    return data.sections.reduce((acc, sec) => acc + (sec.items?.length || 0), 0);
  }, [data]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1e293b" />
        <Text className="mt-4 text-neutral-600">Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-50 items-center justify-center p-4">
        <Text className="text-red-600 text-center">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-4 py-3 bg-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Text className="text-xl font-bold text-white">Veille Tech</Text>
          <WeekPicker
            weeks={weeks}
            currentWeek={currentWeek}
            onSelect={handleWeekChange}
          />
        </View>
        <AuthButton />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top 3 Articles */}
        {data && <Top3 items={data.top3} weekLabel={currentWeek?.week} />}

        {/* Top 3 Videos/Podcasts */}
        {data && <TopVideos items={data.topVideos} weekLabel={currentWeek?.week} />}

        {/* Toggle button */}
        <Pressable
          onPress={() => setShowFullSelection(!showFullSelection)}
          className="self-center flex-row items-center gap-2 px-6 py-3 rounded-full border border-neutral-300 bg-white active:bg-neutral-50"
        >
          <Text className="text-sm font-medium text-neutral-700">
            {showFullSelection
              ? "Masquer la sélection complète"
              : `Voir toute la sélection (${totalArticles} articles)`}
          </Text>
          <Text className="text-neutral-500">{showFullSelection ? "▲" : "▼"}</Text>
        </Pressable>

        {/* Full selection */}
        {showFullSelection && data?.sections.map((section) => (
          <SectionCard
            key={section.title}
            title={section.title}
            items={section.items}
            weekLabel={currentWeek?.week}
          />
        ))}
      </ScrollView>

      {/* Modals */}
      <LoginModal />
      <CommentsModal />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CommentsProvider>
          <AppContent />
        </CommentsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
