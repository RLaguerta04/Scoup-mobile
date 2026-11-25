import { Redirect } from 'expo-router';

// The More tab doesn't navigate to a screen — tapping it pops the overflow bottom sheet
// (see (tabs)/_layout.tsx + components/MoreSheet). This route only exists so the tab button
// has a target; a direct /more deep link just goes home.
export default function MoreRoute() {
  return <Redirect href="/" />;
}
