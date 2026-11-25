import { Text, type TextProps } from 'react-native';
import { TYPE, type TypeVariant } from '@/theme/type';

// Typography primitive. Weight maps to a specific loaded font file (RN doesn't
// synthesize weights well), applied via style so it never collides with NativeWind
// utilities. Size/color come from className. `mono` = Chivo Mono (uppercase labels,
// numeric readouts — a signature of the Scoup look).
//
// `variant` is the preferred way to size text: it applies a role from the shared type
// scale (src/theme/type.ts) — size + line-height + default weight/mono — so sizes come
// from one place instead of hand-typed `text-[Npx]`. An explicit `weight`/`mono` still
// overrides the variant's default, and className keeps setting color, margins, etc.
export type TxtWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

const ARCHIVO: Record<TxtWeight, string> = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
};
const MONO: Record<TxtWeight, string> = {
  regular: 'ChivoMono_400Regular',
  medium: 'ChivoMono_500Medium',
  semibold: 'ChivoMono_500Medium',
  bold: 'ChivoMono_700Bold',
  extrabold: 'ChivoMono_700Bold',
};

interface Props extends TextProps {
  weight?: TxtWeight;
  mono?: boolean;
  variant?: TypeVariant;
  className?: string;
}

export function Txt({ weight, mono, variant, style, className, ...rest }: Props) {
  const spec = variant ? TYPE[variant] : undefined;
  const resolvedWeight: TxtWeight = weight ?? spec?.weight ?? 'regular';
  const resolvedMono = mono ?? spec?.mono ?? false;
  const fontFamily = resolvedMono ? MONO[resolvedWeight] : ARCHIVO[resolvedWeight];
  const variantStyle = spec
    ? {
        fontSize: spec.size,
        lineHeight: spec.lineHeight,
        ...(spec.uppercase ? { textTransform: 'uppercase' as const } : null),
      }
    : null;
  return (
    <Text
      className={`text-ink ${className ?? ''}`}
      style={[{ fontFamily }, variantStyle, style]}
      {...rest}
    />
  );
}

// Uppercase micro-label ("MEDIA METER" / "THIS PERIOD" style).
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Txt mono weight="medium" className={`text-[11px] uppercase tracking-wider text-ink-3 ${className ?? ''}`}>
      {children}
    </Txt>
  );
}
