// Brand palette plus semantic tokens. Prefer the semantic names (background,
// surface, border, textMuted, *Soft) in new code; the older keys are kept so
// existing screens keep working.
const appColors = {
  // Brand
  primary: '#F97516',
  primaryDark: '#D9620C',
  primaryLight: '#FAB47C',
  primarySoft: '#FFF1E6',
  primary2: '#6366F1',

  // Gradients (`colors` of components/GradientView)
  gradientPrimary: ['#FF8A3D', '#F2611D'],
  gradientDark: ['#0B1220', '#162033', '#1F2A44'],

  // Dark surfaces (hero areas, splash)
  ink: '#0B1220',
  inkSoft: '#1F2A44',

  // Surfaces
  background: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E4E7EC',
  borderStrong: '#D0D5DD',
  overlay: 'rgba(16, 24, 40, 0.5)',

  // Text
  text: '#1A1A1A',
  text2: '#6B7280',
  textMuted: '#6B7280',
  textDisabled: '#98A2B3',
  placeholder: '#98A2B3',

  // Status
  success: '#16A34A',
  successSoft: '#E8F6EE',
  warning: '#F59E0B',
  warningSoft: '#FEF3E2',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  info: '#2563EB',
  infoSoft: '#EAF1FE',

  // Neutrals (legacy names)
  black: '#000000',
  white: '#FFFFFF',
  gray: '#808080',
  gray2: '#3C3C3C',
  gray4: '#9D9898',
  gray5: '#F8F9FA',
  gray6: '#F1F5F9',
  lightGray: '#F0F0F0',
  white2: '#CFCFCF',

  // Misc
  yellow: '#FFC107',
  facebook: '#1877F2',
};

export default appColors;
