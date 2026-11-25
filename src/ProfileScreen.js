import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Video } from 'expo-video';
import { getVideos, deleteVideo, formatTime } from './store';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ProfileScreen({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVideos = async () => {
    const items = await getVideos();
    setVideos(items);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => {
    loadVideos();
  }, []));

  const handleDelete = (id) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الفيديو؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: async () => {
          await deleteVideo(id);
          loadVideos();
        }}
      ]
    );
  };

  const renderVideoItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigation.navigate('Feed', { screen: 'Player', params: { id: item.id } })}
      onLongPress={() => handleDelete(item.id)}
      activeOpacity={0.8}
    >
      <Video
        source={{ uri: item.uri }}
        style={styles.thumb}
        resizeMode="cover"
        isMuted
        isLooping
        playPauseEnabled={false}
      />
      <View style={styles.overlay}>
        <Text style={styles.duration}>{formatTime(item.duration || 0)}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBadge} onPress={() => handleDelete(item.id)}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#fe2c55" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>M</Text></View>
        <View>
          <Text style={styles.username}>مستخدم MyReels</Text>
          <Text style={styles.videoCount}>{videos.length} فيديوهات</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Add')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {videos.length > 0 ? (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.gridPadding}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadVideos} tintColor="#fff" />}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.text}>لا توجد فيديوهات مضافة.</Text>
          <TouchableOpacity style={styles.addBtnInline} onPress={() => navigation.navigate('Add')}>
            <Text style={styles.addTextInline}>+ أضف أول فيديو</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, marginTop: 40, borderBottomWidth: 0.5, borderColor: '#333' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  videoCount: { color: '#aaa', fontSize: 14 },
  gridPadding: { padding: 2 },
  gridItem: { flex: 1/3, aspectRatio: 9/16, margin: 1, backgroundColor: '#111' },
  thumb: { flex: 1 },
  overlay: { position: 'absolute', bottom: 5, right: 5 },
  duration: { color: '#fff', fontSize: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 2 },
  deleteBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(254,44,85,0.8)', padding: 5, borderRadius: 10 },
  deleteText: { color: '#fff', fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#aaa', fontSize: 16, marginBottom: 20 },
  addBtn: { marginLeft: 'auto', backgroundColor: '#333', padding: 10, borderRadius: 20 },
  addBtnInline: { backgroundColor: '#fe2c55', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  addTextInline: { color: '#fff', fontWeight: 'bold' }
});