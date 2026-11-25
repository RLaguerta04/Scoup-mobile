import type { ComponentType } from 'react';
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandReddit,
  IconBrandX,
  IconBrandYoutube,
} from '@/components/navIcons';
import type { ChannelPlatform } from '@/types';

type IconProps = { size?: number; color?: string };

// Platform display: brand label, brand mark, and brand color (for the row badge + filter).
export const PLATFORM: Record<
  ChannelPlatform,
  { label: string; Icon: ComponentType<IconProps>; color: string }
> = {
  FACEBOOK: { label: 'Facebook', Icon: IconBrandFacebook, color: '#1877F2' },
  TWITTER: { label: 'X', Icon: IconBrandX, color: '#000000' },
  YOUTUBE: { label: 'YouTube', Icon: IconBrandYoutube, color: '#FF0000' },
  REDDIT: { label: 'Reddit', Icon: IconBrandReddit, color: '#FF4500' },
  INSTAGRAM: { label: 'Instagram', Icon: IconBrandInstagram, color: '#E4405F' },
};

// Filter order (mirrors the web's INFLUENCER_PLATFORMS; the four shown first, Instagram last).
export const CHANNEL_PLATFORMS: ChannelPlatform[] = [
  'FACEBOOK',
  'TWITTER',
  'YOUTUBE',
  'REDDIT',
  'INSTAGRAM',
];
