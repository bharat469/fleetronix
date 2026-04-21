import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { SvgProps } from 'react-native-svg';

export const TruckIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M17 17H19V14H22V10L19 7H14V17H15M1 10H14M1 10V17H3M1 10L3 7H14M3 17H5M5 17C5 18.1 5.9 19 7 19C8.1 19 9 18.1 9 17M5 17H9M9 17H15M15 17C15 18.1 15.9 19 17 19C18.1 19 19 18.1 19 17M12 10V7" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SignpostIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12 2V22M12 4H19L21 6L19 8H12M12 11H5L3 13L5 15H12" stroke="#FF00FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MoneyBagIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12 12V14M12 10V12M12 12H14M10 12H12M19 19H5V7C5 5.89543 5.89543 5 7 5H17C18.1046 5 19 5.89543 19 7V19Z" stroke="#00C853" strokeWidth="2" />
    <Rect x="8" y="9" width="8" height="6" rx="1" stroke="#00C853" strokeWidth="2" />
  </Svg>
);

export const SupportIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#D32F2F" strokeWidth="2" />
    <Path d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11" stroke="#D32F2F" strokeWidth="2" />
    <Circle cx="9" cy="9" r="1" fill="#D32F2F" />
    <Circle cx="15" cy="9" r="1" fill="#D32F2F" />
  </Svg>
);

export const RoadIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 22L8 2M16 2L20 22M12 2V5M12 9V12M12 16V19" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const LedgerIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Rect x="5" y="4" width="14" height="16" rx="2" stroke="#FFCC80" strokeWidth="2" />
    <Path d="M9 8H15M9 12H15M9 16H13" stroke="#FFCC80" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const BellIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LocationIcon = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SearchIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Circle cx="11" cy="11" r="7" stroke="#1E0909" strokeWidth="2" />
    <Path d="M20 20L16 16" stroke="#1E0909" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);





export const LogoutMenuIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#CC2B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 17L21 12L16 7" stroke="#CC2B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 12H9" stroke="#CC2B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRightIcon = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M9 18L15 12L9 6" stroke="#858080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Tab Icons
export const HomeTabIcon = ({ focused, ...props }: SvgProps & { focused?: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" fill={focused ? "#CC2B2B" : "none"} stroke={focused ? "#CC2B2B" : "#858080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 22V12H15V22" stroke={focused ? "white" : "#858080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const WalletTabIcon = ({ focused, ...props }: SvgProps & { focused?: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M20 12V8C20 6.89543 19.1046 6 18 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H18C19.1046 18 20 17.1046 20 16V14M16 12H22M16 12V10M16 12V14" stroke={focused ? "#CC2B2B" : "#858080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChatTabIcon = ({ focused, ...props }: SvgProps & { focused?: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke={focused ? "#CC2B2B" : "#858080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ProfileTabIcon = ({ focused, ...props }: SvgProps & { focused?: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={focused ? "#CC2B2B" : "#858080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="7" r="4" stroke={focused ? "#CC2B2B" : "#858080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
export const BackArrowIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E1A57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const EditPenIcon = (props: SvgProps) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L11 16L7 17L8 13L18.5 2.5Z" stroke="#858080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const HomeHouseIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#CA2027" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 22V12H15V22" stroke="#CA2027" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MoreDotsIcon = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
    <Circle cx="12" cy="12" r="8" stroke="#CA2027" strokeWidth="1.5" />
    <Circle cx="8" cy="12" r="1" fill="#CA2027" />
    <Circle cx="12" cy="12" r="1" fill="#CA2027" />
    <Circle cx="16" cy="12" r="1" fill="#CA2027" />
  </Svg>
);

export const ShareArrowIcon = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
    <Circle cx="12" cy="12" r="8" stroke="#CA2027" strokeWidth="1.5" />
    <Path d="M15 12L12 9M15 12L12 15M15 12H9" stroke="#CA2027" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CloseCircleIcon = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
    <Circle cx="12" cy="12" r="10" fill="#E0E0E0" />
    <Path d="M15 9L9 15M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ShieldCheckIcon = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CameraIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke={props.color || "#CC2B2B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" stroke={props.color || "#CC2B2B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GalleryIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={props.color || "#CC2B2B"} strokeWidth="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={props.color || "#CC2B2B"} />
    <Path d="M21 15L16 10L5 21" stroke={props.color || "#CC2B2B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
