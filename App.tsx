import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';

// Web: preloaded HTMLAudioElements played synchronously inside the tap (required by iOS Safari).
// Prefetched clip Files so navigator.share runs right inside the tap (Safari needs user activation).
const clipUri = (i: number): string =>
  (typeof window !== 'undefined' && (window as any).__NO_CLIPS__?.[i]) || Asset.fromModule(CLIPS[i]).uri;
const clipFiles: Record<number, File> = {};
const prefetchClip = (i: number) => {
  if (clipFiles[i] || typeof fetch === 'undefined') return;
  fetch(clipUri(i))
    .then((r) => r.blob())
    .then((b) => { clipFiles[i] = new File([b], `NO-${CLIP_NAMES[i]}.mp4`, { type: 'video/mp4' }); })
    .catch(() => {});
};

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

// Shareable MP4 clip per voice, same order as SOUNDS.
const CLIPS = [
  require('./assets/clips/zombie.mp4'),
  require('./assets/clips/demon.mp4'),
  require('./assets/clips/banshee.mp4'),
  require('./assets/clips/whisper_scream.mp4'),
  require('./assets/clips/old_man.mp4'),
  require('./assets/clips/creepy_girl.mp4'),
  require('./assets/clips/monster_roar.mp4'),
  require('./assets/clips/opera_diva.mp4'),
  require('./assets/clips/chipmunk.mp4'),
  require('./assets/clips/god_voice.mp4'),
  require('./assets/clips/robot_overlord.mp4'),
  require('./assets/clips/goat_scream.mp4'),
];
const CLIP_NAMES = ["zombie", "demon", "banshee", "whisper_scream", "old_man", "creepy_girl", "monster_roar", "opera_diva", "chipmunk", "god_voice", "robot_overlord", "goat_scream"];

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
  const [lastPlayed, setLastPlayed] = useState(-1);
  const [shareMsg, setShareMsg] = useState('');
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
    setLastPlayed(i);
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
      prefetchClip(i);
      if ((navigator as any).vibrate) (navigator as any).vibrate([80, 40, 120]);
      return;
    }
    try {
      await current.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(SOUNDS[nextIdx()], { shouldPlay: true, volume: 1.0 });
      current.current = sound;
    } catch {}
  };

  const shareLast = async () => {
    const i = lastPlayed;
    if (i < 0) return;
    const fileName = `NO-${CLIP_NAMES[i]}.mp4`;
    try {
      if (Platform.OS === 'web') {
        const file =
          clipFiles[i] ||
          new File([await (await fetch(clipUri(i))).blob()], fileName, { type: 'video/mp4' });
        const nav: any = navigator;
        if (nav.canShare && nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: 'NO.', text: 'NO.' });
          setShareMsg('Sent. They know now.');
        } else {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(file);
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 10000);
          setShareMsg('Downloaded ' + fileName);
        }
      } else {
        const asset = Asset.fromModule(CLIPS[i]);
        await asset.downloadAsync();
        if (asset.localUri && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(asset.localUri, { mimeType: 'video/mp4', UTI: 'public.mpeg-4', dialogTitle: 'Send this NO' });
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') setShareMsg('Could not share. Still NO.');
    }
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
    setShareMsg('');
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
      {lastPlayed >= 0 && (
        <Pressable onPress={shareLast} accessibilityRole="button" accessibilityLabel="Send this NO" style={styles.share}>
          <Text style={styles.shareText}>Send this NO 📤</Text>
        </Pressable>
      )}
      {!!shareMsg && <Text style={styles.shareMsg}>{shareMsg}</Text>}
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
  share: { marginTop: 28, backgroundColor: '#2a2a2a', borderRadius: 30, paddingVertical: 14, paddingHorizontal: 26, borderWidth: 2, borderColor: '#d10f0f' },
  shareText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  shareMsg: { color: '#999', fontSize: 14, marginTop: 10 },
  caption: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 50, textAlign: 'center', paddingHorizontal: 30 },
});
