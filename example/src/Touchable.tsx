import React, {FC, ReactNode, useState} from 'react';
import {Animated, Easing, Pressable, StyleProp, ViewStyle} from 'react-native';

interface ITouchableProps {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const Touchable: FC<ITouchableProps> = ({children, onPress, style}) => {
  const [animation] = useState(new Animated.Value(0));

  const animatedStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.8],
        }),
      },
    ],
  };

  const timingConfig = {
    duration: 700,
    easing: Easing.out(Easing.exp),
    useNativeDriver: true,
  };

  const onPressIn = () => {
    Animated.timing(animation, {
      toValue: 1,
      ...timingConfig,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(animation, {
      toValue: 0,
      ...timingConfig,
    }).start();
  };

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{width:'100%'}}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default Touchable;
