import React from 'react';
import { SvgProps } from 'react-native-svg';
import { scale, verticalScale } from './dimension';
import { COLORS } from './values/colors';
import { SVG_Url, IconName } from './values/imageUrl';


type SvgIconsProps = SvgProps & {
  name: IconName;
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
};

const SvgIcon: React.FC<SvgIconsProps> = ({
  name,
  width = verticalScale(100),
  height = scale(100),
  fill = COLORS.secondary,

  ...props
}) => {
  const IconComponent = SVG_Url[name];
  if (!IconComponent) {
    console.log(`No SVG icon found with name "${name}`);
    return null;
  }
  return <IconComponent width={width} height={height} fill={fill} {...props} />;
};

export type IconNameType = keyof typeof SVG_Url;
export default SvgIcon;