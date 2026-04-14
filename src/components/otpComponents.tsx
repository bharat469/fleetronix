import React, {
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../helpers/values/colors';


interface OTPInputProps {
    length?: number;
    onChangeOTP?: (otp: string) => void;
}

export interface OTPInputRef {
    clear: () => void;
    focus: () => void;
}



const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(
    ({ length = 6, onChangeOTP }, ref) => {
        const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
        const [focusedIndex, setFocusedIndex] = useState<number>(0);
        const inputsRef = useRef<TextInput[]>([]);

        useImperativeHandle(ref, () => ({
            clear: () => {
                setOtp(Array(length).fill(''));
                inputsRef.current[0]?.focus();
            },
            focus: () => {
                inputsRef.current[0]?.focus();
            },
        }));

        const handleChange = (text: string, index: number) => {
            const newOtp = [...otp];
            newOtp[index] = text;
            setOtp(newOtp);
            onChangeOTP?.(newOtp.join(''));

            // Move to next input if a digit is entered
            if (text && index < length - 1) {
                inputsRef.current[index + 1]?.focus();
                setFocusedIndex(index + 1);
            }
        };

        const handleKeyPress = ({ nativeEvent: { key } }: any, index: number) => {
            // If the pressed key is backspace and the current input is empty,
            // move the focus to the previous input.
            if (key === 'Backspace' && !otp[index] && index > 0) {
                inputsRef.current[index - 1]?.focus();
                setFocusedIndex(index - 1);
            }
        };

        return (
            <View style={styles.container}>
                {otp.map((digit, index) => (
                    <View key={index} style={[styles.box, focusedIndex === index && styles.boxActive]}>
                        <TextInput
                            ref={input => {
                                if (input) inputsRef.current[index] = input;
                            }}
                            value={digit}
                            onChangeText={text => handleChange(text, index)}
                            onKeyPress={e => handleKeyPress(e, index)}
                            onFocus={() => setFocusedIndex(index)}
                            style={styles.input}
                            maxLength={1}
                            keyboardType="number-pad"
                            textAlign="center"
                            selectionColor="transparent"
                        />
                        {digit === '' && focusedIndex === index && (
                            <View style={styles.cursor} />
                        )}
                    </View>
                ))}
            </View>
        );
    },
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    box: {
        width: 60,
        height: 70,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    boxActive: {
        borderColor: 'rgba(0,0,0,0.15)',
        shadowOpacity: 0.1,
    },
    input: {
        width: '100%',
        height: '100%',
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textColor.color1,
        textAlign: 'center',
    },
    cursor: {
        position: 'absolute',
        width: 2,
        height: 30,
        backgroundColor: COLORS.primary,
    },
});

export default OTPInput;