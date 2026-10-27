import { useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { formatDateOnlyLabel, parseDateOnly, toLocalDateInput, todayAsLocalDateInput } from "@/lib/time";
import { formatRatingLabel } from "@/lib/media";
import { useTheme } from "@/theme";
import type { LogMediaInput } from "@/api/diary";
import { AppText, Button, IconButton, Sheet, TextField } from "@/components/ui";
import { RocketRatingInput } from "./RocketRating";

type LogMediaSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  kicker: string;
  accentColor: string;
  initialRating: number | null;
  isSubmitting: boolean;
  onSubmit: (input: LogMediaInput) => Promise<void>;
};

const shiftDate = (dateInput: string, days: number): string => {
  const date = parseDateOnly(dateInput);
  date.setDate(date.getDate() + days);
  return toLocalDateInput(date);
};

// Mobile equivalent of the web's LogMediaDialog: watched date, rating,
// rewatch, optional review with a spoiler flag. Mounted only while open (the
// parent renders it conditionally) so every open starts from fresh state.
export const LogMediaSheet = ({
  isOpen,
  onClose,
  title,
  kicker,
  accentColor,
  initialRating,
  isSubmitting,
  onSubmit,
}: LogMediaSheetProps) => {
  const { colors, radius } = useTheme();
  const today = todayAsLocalDateInput();
  const [watchedDate, setWatchedDate] = useState(today);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [rewatch, setRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  const handleSubmit = async () => {
    const trimmedReview = review.trim();
    try {
      await onSubmit({
        watchedDate,
        rating: rating ?? undefined,
        rewatch,
        review: trimmedReview.length > 0 ? trimmedReview : undefined,
        containsSpoilers: trimmedReview.length > 0 ? containsSpoilers : undefined,
      });
      onClose();
    } catch {
      // The mutation hook already surfaced the error as a toast; keep the
      // sheet open so nothing the user typed is lost.
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={title} kicker={kicker}>
      <View style={{ gap: 8 }}>
        <AppText variant="kicker" size={10} tone="muted">
          Watched on
        </AppText>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius,
            backgroundColor: colors.input,
            paddingHorizontal: 4,
          }}
        >
          <IconButton
            accessibilityLabel="Previous day"
            onPress={() => setWatchedDate((current) => shiftDate(current, -1))}
            icon={<ChevronLeft size={20} color={colors.foreground} />}
          />
          <Pressable onPress={() => setWatchedDate(today)}>
            <AppText weight="semibold">
              {watchedDate === today ? "Today" : formatDateOnlyLabel(watchedDate)}
            </AppText>
          </Pressable>
          <IconButton
            accessibilityLabel="Next day"
            onPress={() => setWatchedDate((current) => (current >= today ? current : shiftDate(current, 1)))}
            icon={<ChevronRight size={20} color={watchedDate >= today ? colors.faint : colors.foreground} />}
          />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <AppText variant="kicker" size={10} tone="muted">
            Rating
          </AppText>
          <AppText variant="mono" size={12} color={accentColor}>
            {formatRatingLabel(rating) ?? "—"}
          </AppText>
        </View>
        <RocketRatingInput value={rating} onChange={setRating} size={26} color={accentColor} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <AppText weight="medium">Rewatch</AppText>
        <Switch
          value={rewatch}
          onValueChange={setRewatch}
          trackColor={{ true: accentColor, false: colors.border }}
          thumbColor={colors.foreground}
        />
      </View>

      <TextField
        label="Review (optional)"
        placeholder="What did you think?"
        multiline
        maxLength={5000}
        value={review}
        onChangeText={setReview}
      />

      {review.trim().length > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText weight="medium">Contains spoilers</AppText>
          <Switch
            value={containsSpoilers}
            onValueChange={setContainsSpoilers}
            trackColor={{ true: colors.spoiler, false: colors.border }}
            thumbColor={colors.foreground}
          />
        </View>
      ) : null}

      <Button label="Save log" onPress={handleSubmit} loading={isSubmitting} size="lg" fullWidth />
    </Sheet>
  );
};
