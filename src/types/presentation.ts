export type AspectRatio = '16:9' | '16:10' | '4:3';

export type ShapeKind =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'arrow'
  | 'line'
  | 'callout'
  | 'chevron'
  | 'freeform';

export type ElementType = 'shape' | 'text' | 'image' | 'svg';

export interface FillStyle {
  mode: 'solid' | 'gradient' | 'none';
  colour: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  gradientType: 'linear' | 'radial';
}

export interface OutlineStyle {
  colour: string;
  width: number;
  dash: 'solid' | 'dashed' | 'dotted';
}

export interface ShadowStyle {
  enabled: boolean;
  colour: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700 | 800;
  italic: boolean;
  underline: boolean;
  colour: string;
  align: 'left' | 'centre' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
}

export interface ElementStyle {
  fill: FillStyle;
  outline: OutlineStyle;
  shadow: ShadowStyle;
  opacity: number;
  cornerRadius: number;
  typography: TypographyStyle;
}

export type AnimationCategory = 'entrance' | 'emphasis' | 'exit' | 'motion-path';
export type AnimationStart = 'on-click' | 'with-previous' | 'after-previous';
export type TextDeliveryMode = 'all' | 'paragraph' | 'word' | 'letter';

export interface PathPoint {
  x: number;
  y: number;
}

export interface ElementAnimation {
  id: string;
  category: AnimationCategory;
  effect: string;
  options: Record<string, string | number | boolean>;
  start: AnimationStart;
  duration: number;
  delay: number;
  repeat: number; // 1, 2, 3, 5, or 0 for 'Until Next Click'
  rewind: boolean;
  order: number;
  textDelivery?: TextDeliveryMode;
  customPoints?: PathPoint[];
}

export interface SlideTransition {
  type: string;
  category: 'subtle' | 'exciting' | 'dynamic';
  direction?: string;
  duration: number;
  easing: string;
  morphMode?: 'objects' | 'words' | 'characters';
}

export interface SlideElement {
  id: string;
  name: string;
  type: ElementType;
  shapeKind?: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  groupId?: string | null;
  locked: boolean;
  visible: boolean;
  text: string;
  imageSrc?: string;
  svgContent?: string;
  path?: string;
  style: ElementStyle;
  animations: ElementAnimation[];
}

export interface SlideBackground {
  mode: 'solid' | 'gradient';
  colour: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
}

export interface Slide {
  id: string;
  title: string;
  background: SlideBackground;
  useMaster: boolean;
  elements: SlideElement[];
  transition: SlideTransition;
  notes: string;
}

export interface SlideMaster {
  background: SlideBackground;
  accentColour: string;
  headingFont: string;
  bodyFont: string;
  headingColour: string;
  bodyColour: string;
  showFooter: boolean;
  footerText: string;
  showSlideNumber: boolean;
  showAccentBar: boolean;
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  themeId: string;
  master: SlideMaster;
  slides: Slide[];
  updatedAt: number;
}

export type ThemeMode = 'dark' | 'light' | 'high-contrast';
export type AccentScheme = 'sapphire' | 'emerald' | 'amber' | 'rose' | 'indigo';
export type TextSizeSetting = 'small' | 'medium' | 'large' | 'xl';
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';
export type PanelLayout = 'default' | 'focused' | 'swapped';
export type ZoomMode = 'fit' | 'fill' | '100' | 'custom';

export type StudioModuleId =
  | 'designer'
  | 'transitions'
  | 'animations'
  | 'merge'
  | 'guided'
  | 'choreographer'
  | 'learn';

export interface PanelVisibilitySettings {
  designerSlides: boolean;
  designerInsert: boolean;
  designerAssets: boolean;
  designerProperties: boolean;
  designerTimeline: boolean;
  labLeft: boolean;
  labRight: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  accent: AccentScheme;
  textSize: TextSizeSetting;
  density: LayoutDensity;
  panelLayout: PanelLayout;
  reduceMotion: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  showRulers: boolean;
  gridSize: number;
  showLearnDock: boolean;
  panels: PanelVisibilitySettings;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  background: SlideBackground;
  accentColour: string;
  secondaryColour: string;
  headingColour: string;
  bodyColour: string;
  headingFont: string;
  bodyFont: string;
  swatches: string[];
}
