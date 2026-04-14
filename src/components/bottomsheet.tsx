import { StyleSheet, Text, View } from 'react-native';
import React, { ReactNode } from 'react';
import Modal from 'react-native-modal';

interface bottomComponentprops {
    isVisible: boolean;
    onBackdropPress?: () => void;
    onBackButtonPress?: () => void;
    children: ReactNode;
}

const BottomSheetComponent: React.FC<bottomComponentprops> = ({
    isVisible = false,
    onBackButtonPress,
    onBackdropPress,
    children,
}) => {
    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onBackdropPress}
            style={{ margin: 0 }}
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

const styles = StyleSheet.create({});