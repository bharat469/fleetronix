export const Fonts = {
  ApercuPro: {
    Black: 'ApercuPro-Black',
    BlackItalic: 'ApercuPro-BlackItalic',
    Bold: 'ApercuPro-Bold',
    BoldItalic: 'ApercuPro-BoldItalic',
    ExtraLight: 'ApercuPro-ExtraLight',
    ExtraLightItalic: 'ApercuPro-ExtraLightItalic',
    Italic: 'ApercuPro-Italic',
    Light: 'ApercuPro-Light',
    LightItalic: 'ApercuPro-LightItalic',
    Medium: 'ApercuPro-Medium',
    MediumItalic: 'ApercuPro-MediumItalic',
    Regular: 'ApercuPro-Regular',
    Thin: 'ApercuPro-Thin',
    ThinItalic: 'ApercuPro-ThinItalic',
  },
  InknutAntiqua: {
    Black: 'InknutAntiqua-Black',
    Bold: 'InknutAntiqua-Bold',
    ExtraBold: 'InknutAntiqua-ExtraBold',
    Light: 'InknutAntiqua-Light',
    Medium: 'InknutAntiqua-Medium',
    Regular: 'InknutAntiqua-Regular',
    SemiBold: 'InknutAntiqua-SemiBold',
  },
};

export const getFontFamily = (family: keyof typeof Fonts, weight: string) => {
  const selectedFamily = Fonts[family] as Record<string, string>;
  return selectedFamily[weight] || selectedFamily['Regular'];
};
