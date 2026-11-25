import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Video } from 'expo-video';
import { getVideos } from './store';
import { useFocusEffect } from '@react-navigation/native';

export default function FeedScreen({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const items = await getVideos();
        if (!cancelled) setVideos(items);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleVideoRef = (index, ref) => {
    videoRefs.current[index] = ref;
  };

  const handleScroll = useCallback((e) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / Dimensions.get('window').height);
    if (index !== activeIndex && index >= 0 && index < videos.length) {
      setActiveIndex(index);
    }
  }, [activeIndex, videos.length]);

  useEffect(() => {
    // Pause all videos except active
    Object.entries(videoRefs.current).forEach(([index, ref]) => {
      if (ref && typeof ref.pauseAsync === 'function') {
        if (parseInt(index) !== activeIndex) {
          ref.pauseAsync().catch(() => {});
        }
      }
    });

    // Play active video
    const activeRef = videoRefs.current[activeIndex];
    if (activeRef && typeof activeRef.playAsync === 'function') {
      activeRef.playAsync().catch(() => {});
    }
  }, [activeIndex, videos.length]);

  const renderItem = ({ item, index }) => (
    <VideoItem
      item={item}
      isActive={index === activeIndex}
      index={index}
      ref={(ref) => handleVideoRef(index, ref)}
    />
  );

  return (
    <View style={styles.container}>
      {videos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.text}>لا توجد فيديوهات مضافة بعد.</Text>
          <TouchableOpacity style={styles.addBtnInline} onPress={() => navigation.navigate('Add')}>
            <Text style={styles.addTextInline}>+ أضف أول فيديو</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          pagingEnabled
          onMomentumScrollEnd={handleScroll}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        />
      )}
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Add')}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const VideoItem = React.forwardRef(function VideoItem({ item, isActive, index }, ref) {
  const [status, setStatus] = useState(null);

  return (
    <View style={styles.videoWrap}>
      <Video
        ref={ref}
        source={{ uri: item.uri }}
        style={styles.video}
        resizeMode="cover"
        isLooping
        isMuted={!isActive}
        playPauseEnabled={false}
        onPlaybackStatusUpdate={setStatus}
        onLoad={() => {
          if (isActive) {
            // Video will auto-play due to isMuted={false} when active
          }
        }}
        onError={(e) => console.warn('Video error:', e)}
      />
    </View>
  );
});

const { height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoWrap: { height, width: '100%' },
  video: { flex: 1 },
  addBtn: { position: 'absolute', bottom: 40, right: 20, backgroundColor: '#fe2c55', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  addText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 16, marginBottom: 20 },
  addBtnInline: { backgroundColor: '#fe2c55', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  addTextInline: { color: '#fff', fontWeight: 'bold' }
});