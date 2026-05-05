import Svg, { Path, SvgProps, Circle, Text as SVGText } from "react-native-svg";


const ArrowRight = (props: SvgProps) => (
  <Svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'white'}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M5 12h14" />
    <Path d="M12 5l7 7-7 7" />
  </Svg>
);

const PhoneIcon = ({ size = 24, color = '#d3d3d3' }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);



const CheckIcon = ({ size = 20, color = '#CC2B2B' }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);



export const SVG_Url = {
  arrowRight: ArrowRight,
  phoneIcon: PhoneIcon,
  checkIcon: CheckIcon,
  fleetronixLogo: require('../../assets/images/svg/Fleetronix.svg').default,
  truckIcon: require('../../assets/images/svg/truck.svg').default,
  searchIcon: require('../../assets/images/svg/search.svg').default,
  cloudUpload: require('../../assets/images/svg/upload.svg').default,
  camerIcon: require('../../assets/images/svg/cameraIcon.svg').default,
  callIcon: require('../../assets/images/svg/phoneActions.svg').default,
  locationIllustration: require('../../assets/images/svg/location.svg').default,
  accountMenuIcon: require('../../assets/images/svg/account.svg').default,
  kycMenuIcon: require('../../assets/images/svg/kyc.svg').default,
  statusMenuIcon: require('../../assets/images/svg/status.svg').default,
  notificationMenuIcon: require('../../assets/images/svg/notification.svg').default,
  sleepIcon: require('../../assets/images/svg/sleep.svg').default,
  drivingIcon: require('../../assets/images/svg/driving.svg').default,
  newTrip: require('../../assets/images/svg/newTrip.svg').default,
  waiting: require('../../assets/images/svg/waiting.svg').default,
  clock: require('../../assets/images/svg/clock.svg').default,
  pin: require('../../assets/images/svg/pin.svg').default,
  confirmationNumber: require('../../assets/images/svg/forms/confirmationNumber.svg').default,
  deliveryTime: require('../../assets/images/svg/forms/deleveryTime.svg').default,
  recipentName: require('../../assets/images/svg/forms/recipentName.svg').default,
  uploadDocument: require('../../assets/images/svg/forms/upload.svg').default,
  phoneActions: require('../../assets/images/svg/forms/phone.svg').default,
  congratulations: require('../../assets/images/svg/congrats.svg').default,

}

export type IconName = keyof typeof SVG_Url;