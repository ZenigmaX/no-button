import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Asset } from 'expo-asset';

// Web: preloaded HTMLAudioElements played synchronously inside the tap (required by iOS Safari).
const webAudio: any[] =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? [] : [];

const SOUNDS = [
  require('./assets/sounds/zombie.mp3'),
  require('./assets/sounds/demon.mp3'),
  require('./assets/sounds/banshee.mp3'),
  require('./assets/sounds/whisper_scream.mp3'),
  require('./assets/sounds/old_man.mp3'),
  require('./assets/sounds/creepy_girl.mp3'),
  require('./assets/sounds/monster_roar.mp3'),
  require('./assets/sounds/opera_diva.mp3'),
  require('./assets/sounds/chipmunk.mp3'),
  require('./assets/sounds/god_voice.mp3'),
  require('./assets/sounds/robot_overlord.mp3'),
  require('./assets/sounds/goat_scream.mp3'),
];

const CAPTIONS = [
  'Absolutely not.', 'Ask again and see.', 'Nope. Nope. Nope.', 'Hard pass.',
  'Not today, Satan.', 'The answer was always no.', 'Denied with prejudice.',
  'Over my dead button.', 'Computer says no.', 'Let me think... NO.',
  'Try again in never.', 'That was easy.*  *it was not.',
];

// On web, a single-file build can inject data: URIs via window.__NO_SOUNDS__ (same order as SOUNDS).
const webUri = (i: number): string =>
  (typeof window !== 'undefined' && (window as any).__NO_SOUNDS__?.[i]) || Asset.fromModule(SOUNDS[i]).uri;

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export default function App() {
  const [count, setCount] = useState(0);
  const [caption, setCaption] = useState('Go ahead. Ask me anything.');
  const scale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const current = useRef<Audio.Sound | null>(null);
  const lastIdx = useRef(-1);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    }).catch(() => {});
    if (Platform.OS === 'web') {
      SOUNDS.forEach((_m, i) => {
        const a = new (window as any).Audio(webUri(i));
        a.preload = 'auto';
        webAudio[i] = a;
      });
    }
    return () => { current.current?.unloadAsync(); };
  }, []);

  // never the same voice twice in a row
  const nextIdx = () => {
    const prev = lastIdx.current;
    let i = Math.floor(Math.random() * (prev < 0 ? SOUNDS.length : SOUNDS.length - 1));
    if (prev >= 0 && i >= prev) i += 1;
    lastIdx.current = i;
    return i;
  };

  const playNo = async () => {
    if (Platform.OS === 'web') {
      const i = nextIdx();
      if (!webAudio[i]) webAudio[i] = new (window as any).Audio(webUri(i));
      const a = webAudio[i];
      a.currentTime = 0;
      a.volume = 1;
      a.play().catch(() => {});
      if ((navigator as any).vibrate) (navigator as any).vibrate([80, 40, 120]);
      return;
    }
    try {
      await current.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(SOUNDS[nextIdx()], { shouldPlay: true, volume: 1.0 });
      current.current = sound;
    } catch {}
  };

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.86, useNativeDriver: true, speed: 50 }).start();
  };

  const onPress = () => {
    playNo();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 240);
    }
    setCount((c) => c + 1);
    setCaption(pick(CAPTIONS));
    shake.setValue(0);
    Animated.sequence(
      [14, -14, 10, -10, 6, -6, 0].map((v) =>
        Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: true }))
    ).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.root, { transform: [{ translateX: shake }] }]}>
      <StatusBar style="light" />
      <Text style={styles.counter}>NOs given: {count}</Text>
      <Pressable onPressIn={onPressIn} onPress={onPress} onPressOut={onPressOut}
        accessibilityRole="button" accessibilityLabel="NO">
        <View style={styles.base}>
          <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
            <View style={styles.inner} />
            <View style={styles.highlight} />
            <Text style={styles.no}>NO</Text>
          </Animated.View>
        </View>
      </Pressable>
      <Text style={styles.caption}>{caption}</Text>
    </Animated.View>
  );
}

const SIZE = 280;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  counter: { color: '#bbb', fontSize: 20, fontWeight: '700', marginBottom: 40, letterSpacing: 1 },
  base: {
    width: SIZE + 30, height: SIZE + 30, borderRadius: (SIZE + 30) / 2, backgroundColor: '#3a3a3a',
    alignItems: 'center', justifyContent: 'center', borderBottomWidth: 10, borderColor: '#1f1f1f',
  },
  button: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: '#b00000',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderBottomWidth: 14, borderBottomColor: '#6a0000',
    shadowColor: '#ff0000', shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, elevation: 20,
  },
  inner: { position: 'absolute', top: 10, width: SIZE - 40, height: SIZE - 40, borderRadius: SIZE, backgroundColor: '#e01616' },
  highlight: {
    position: 'absolute', top: 28, left: 55, width: SIZE * 0.5, height: SIZE * 0.22,
    borderRadius: SIZE, backgroundColor: 'rgba(255,255,255,0.35)', transform: [{ rotate: '-15deg' }],
  },
  no: {
    color: '#fff', fontSize: 110, fontWeight: '900', letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 6,
  },
  caption: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 50, textAlign: 'center', paddingHorizontal: 30 },
});
