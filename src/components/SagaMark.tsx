import { Image } from 'expo-image';

const LOGO = require('../../assets/images/scoup-logo.png');

// The scoup brand logomark (yellow "S" speech bubble) — Saga's identity. Shared by the chat
// screen's empty state and the floating "Ask Scoup" button, so both use the real asset.
export function SagaMark({ size = 20 }: { size?: number }) {
  return (
    <Image
      source={LOGO}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Scoup"
    />
  );
}
