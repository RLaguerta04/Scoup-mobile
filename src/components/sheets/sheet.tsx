import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { colors } from '@/theme/tokens';

// Shared bits for the header's bottom sheets.
export type SheetHandle = { present: () => void };

export const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.3} />
);

export const sheetSurface = {
  backgroundStyle: { backgroundColor: colors.surface },
  handleIndicatorStyle: { backgroundColor: colors.border },
};
