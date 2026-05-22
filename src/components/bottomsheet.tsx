import React, { ReactNode } from 'react';
import Modal from 'react-native-modal';

interface bottomComponentprops {
    isVisible: boolean;
    onBackdropPress?: () => void;
    onBackButtonPress?: () => void;
    children: ReactNode;
    style?: any;
}

const BottomSheetComponent: React.FC<bottomComponentprops> = ({
    isVisible = false,
    onBackButtonPress,
    onBackdropPress,
    children,
    style,
}) => {
    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onBackdropPress}
            style={[{ margin: 0 }, style]}
            onBackButtonPress={onBackButtonPress}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropOpacity={0.4}
            useNativeDriver={false}
            statusBarTranslucent
        >
            {children}
        </Modal>
    );
};

export default BottomSheetComponent;