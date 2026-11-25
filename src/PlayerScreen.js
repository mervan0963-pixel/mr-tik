import { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Video } from 'expo-video';
import { getVideos, deleteVideo } from './store';

export default function PlayerScreen({ route, navigation }) {
  const initialId = route?.params?.id;
  const [videos, setVideos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [controlsTimer, setControlsTimer] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const items = await getVideos();
      setVideos(items);
      const idx = initialId ? items.findIndex((v) => v.id === initialId) : 0;
      setActiveIndex(idx >= 0 ? idx : 0);
    };
    load();
  }, [initialId]);

  const current = videos[activeIndex];

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No videos found.</Text>
      </View>
    );
  }

  const playPause = () => {
    if (isPaused) {
      videoRef.current?.playAsync?.();
      setIsPaused(false);
    } else {
      videoRef.current?.pauseAsync?.();
      setIsPaused(true);
    }
  };

  const onSwipe = useCallback((direction) => {
    setActiveIndex((prev) => {
      if (direction > 0 && prev < videos.length - 1) return prev + 1;
      if (direction < 0 && prev > 0) return prev - 1;
      return prev;
    });
    videoRef.current?.seekAsync?.(0);
    setIsPaused(false);
  }, [videos.length]);

  const onDelete = async () => {
    await deleteVideo(current.id);
    const next = await getVideos();
    setVideos(next);
    if (next.length === 0) {
      navigation.goBack();
    } else {
      setActiveIndex(Math.min(activeIndex, next.length - 1));
    }
  };

  const toggleControls = () => setShowControls((prev) => !prev);
  const resetControlsTimer = () => {
    if (controlsTimer) clearTimeout(controlsTimer);
    const t = setTimeout(() => setShowControls(false), 3000);
    setControlsTimer(t);
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimer) clearTimeout(controlsTimer);
    };
  }, [activeIndex]);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: current.uri }}
        style={styles.video}
        resizeMode="cover"
        isLooping
        isMuted={false}
        volume={volume}
        playbackRate={speed}
        onPlaybackStatusUpdate={(status) => {
          setPlaybackStatus(status);
          if (status.didJustFinish) {
            setActiveIndex((prev) => (prev < videos.length - 1 ? prev + 1 : prev));
          }
        }}
        onLoad={(status) => {
          setPlaybackStatus(status);
          setIsPaused(false);
        }}
        onError={(e) => {
          Alert.alert('Playback error', 'Could not play this video.');
        }}
      />

      <TouchableOpacity style={styles.fullTap} onPress={toggleControls} activeOpacity={1} />

      <View style={[styles.controlsOverlay, showControls ? { opacity: 1 } : { opacity: 0, pointerEvents: 'none' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.infoWrap}>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.meta}>
            {formatTime(playbackStatus?.positionMillis)} / {formatTime(current.duration || playbackStatus?.durationMillis || 0)}
          </Text>
        </View>

        <View style={styles.rowWrap}>
          <TouchableOpacity style={styles.iconBtn} onPress={playPause} activeOpacity={0.8}>
            <Text style={styles.iconText}>{isPaused ? '▶' : '❚❚'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setVolume((v) => (v > 0 ? 0 : 1))} activeOpacity={0.8}>
            <Text style={styles.iconText}>{volume > 0 ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))} activeOpacity={0.8}>
            <Text style={styles.speedText}>{speed}x</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => videoRef.current?.seekAsync?.(0)} activeOpacity={0.8}>
            <Text style={styles.iconText}>↻</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
          <Text style={styles.deleteText}>✕ Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.swipeHints}>
        <Text style={styles.hint}>Swipe up/down for next video</Text>
      </View>
    </View>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1, width: '100%', height: height, backgroundColor: '#000' },
  fullTap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'center',
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtn: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    zIndex: 25,
  },
  backText: { color: '#fff', fontSize: 22 },
  infoWrap: { position: 'absolute', bottom: 120, left: 16, right: 16, zIndex: 25 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  meta: { color: '#ccc', fontSize: 14 },
  rowWrap: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    zIndex: 25,
  },
  iconBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 26,
    padding: 10,
    alignItems: 'center',
    width: 52,
    height: 52,
  },
  speedText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  iconText: { color: '#fff', fontSize: 24 },
  deleteBtn: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    backgroundColor: '#ff3b30',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 25,
  },
  deleteText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  swipeHints: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 25,
  },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 16 },
});

function formatTime(ms) {
  if (!ms || ms <= 0 || !isFinite(ms)) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}