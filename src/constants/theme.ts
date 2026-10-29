export const colors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  ink: '#000000',
  muted: '#636366',
  faint: '#8E8E93',
  line: 'rgba(60, 60, 67, 0.12)',
  separator: 'rgba(60, 60, 67, 0.29)',
  navy: '#1C3D5A',
  onNavy: '#FFFFFF',
  accent: '#1F6B4A',
  accentPressed: '#184F37',
  accentSoft: '#E7F3EC',
  danger: '#FF3B30',
  dangerSoft: '#FDECEC',
  warningSoft: '#F8F1E3',
  field: '#FFFFFF',
  fill: 'rgba(120, 120, 128, 0.12)',
  search: 'rgba(120, 120, 128, 0.12)',
  disabled: '#C7C7CC',
  white: '#FFFFFF',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
} as const;

export const type = {
  largeTitle: 34,
  title: 22,
  section: 17,
  body: 17,
  label: 13,
  small: 12,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
