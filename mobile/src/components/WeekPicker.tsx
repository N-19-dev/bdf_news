import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { useState } from "react";
import type { WeekMeta } from "../lib/parse";

type Props = {
  weeks: WeekMeta[];
  currentWeek: WeekMeta | null;
  onSelect: (week: WeekMeta) => void;
};

export default function WeekPicker({ weeks, currentWeek, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (week: WeekMeta) => {
    onSelect(week);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center gap-1 active:opacity-70"
      >
        <View>
          <Text className="text-sm text-slate-400">Semaine</Text>
          <Text className="text-base font-semibold text-white">
            {currentWeek?.week || "..."}{" "}
            <Text className="text-slate-400">▼</Text>
          </Text>
        </View>
      </Pressable>

      {/* Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-2xl max-h-[70%]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200">
              <Text className="text-lg font-bold text-neutral-900">
                Choisir une semaine
              </Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                className="p-2"
              >
                <Text className="text-neutral-500 text-lg">✕</Text>
              </Pressable>
            </View>

            {/* Week list */}
            <ScrollView className="p-2">
              {weeks.map((week) => {
                const isSelected = currentWeek?.week === week.week;
                return (
                  <Pressable
                    key={week.week}
                    onPress={() => handleSelect(week)}
                    className={`flex-row items-center justify-between p-4 rounded-xl mb-1 ${
                      isSelected ? "bg-slate-800" : "bg-neutral-50 active:bg-neutral-100"
                    }`}
                  >
                    <View>
                      <Text
                        className={`text-base font-semibold ${
                          isSelected ? "text-white" : "text-neutral-900"
                        }`}
                      >
                        {week.week}
                      </Text>
                      {week.range && (
                        <Text
                          className={`text-sm ${
                            isSelected ? "text-slate-300" : "text-neutral-500"
                          }`}
                        >
                          {week.range}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Text className="text-white text-lg">✓</Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
