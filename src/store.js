import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-video';

const getBaseDir = () => {
  return FileSystem.documentDirectory || FileSystem.cacheDirectory || './';
};

export const VIDEO_DIR = getBaseDir() + 'mr_tik_videos/';
const INDEX_URI = VIDEO_DIR + 'index.json';

export async function ensureStorage() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(VIDEO_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VIDEO_DIR, { intermediates: true });
    }

    const idxInfo = await FileSystem.getInfoAsync(INDEX_URI);
    if (!idxInfo.exists) {
      await FileSystem.writeAsStringAsync(INDEX_URI, '[]');
    }
  } catch (e) {
    console.error('Storage Init Error:', e);
    throw e;
  }
}

export async function getVideos() {
  await ensureStorage();
  try {
    const raw = await FileSystem.readAsStringAsync(INDEX_URI);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const valid = [];
    for (const v of parsed) {
      try {
        const info = await FileSystem.getInfoAsync(v.uri);
        if (info.exists) valid.push(v);
      } catch (e) {
        console.warn('Video file check failed:', e);
      }
    }
    return valid;
  } catch (e) {
    console.error('Get Videos Error:', e);
    return [];
  }
}

async function saveVideos(entries) {
  try {
    await FileSystem.writeAsStringAsync(INDEX_URI, JSON.stringify(entries));
  } catch (e) {
    console.error('Save Index Error:', e);
    throw e;
  }
}

async function getVideoDuration(uri) {
  try {
    // Use expo-video to get metadata/duration
    const video = Video.create();
    video.loadAsync({ uri });
    // Wait a bit for metadata to load
    await new Promise(resolve => setTimeout(resolve, 500));
    const status = video.getStatus();
    video.unloadAsync();
    return status?.durationMillis || 0;
  } catch (e) {
    console.warn('Could not get video duration:', e);
    return 0;
  }
}

export async function addVideo(sourceUri, title) {
  await ensureStorage();

  const name = 'v_' + Date.now() + '_' + Math.floor(Math.random() * 100000) + '.mp4';
  const target = VIDEO_DIR + name;

  try {
    await FileSystem.copyAsync({ from: sourceUri, to: target });
  } catch (copyErr) {
    console.warn('فشل نسخ الملف، سنستخدم المسار الأصلي:', copyErr);
    const videos = await getVideos();
    const duration = await getVideoDuration(sourceUri);
    const entry = {
      id: Date.now(),
      uri: sourceUri,
      title: title || 'فيديو جديد',
      timestamp: Date.now(),
      liked: false,
      duration,
    };
    const next = [entry, ...videos];
    await saveVideos(next);
    return entry;
  }

  const videos = await getVideos();
  const duration = await getVideoDuration(target);
  const entry = {
    id: Date.now(),
    uri: target,
    title: title || 'فيديو جديد',
    timestamp: Date.now(),
    liked: false,
    duration,
  };

  const next = [entry, ...videos];
  await saveVideos(next);
  return entry;
}

export async function deleteVideo(id) {
  const videos = await getVideos();
  const target = videos.find((v) => v.id === id);
  const next = videos.filter((v) => v.id !== id);
  await saveVideos(next);

  if (target && target.uri.includes(VIDEO_DIR)) {
    try {
      await FileSystem.deleteAsync(target.uri, { idempotent: true });
    } catch (e) {
      console.warn('Failed to delete video file:', e);
    }
  }
}

export async function toggleLike(id) {
  const videos = await getVideos();
  let liked = false;
  const next = videos.map((v) => {
    if (v.id === id) {
      liked = !v.liked;
      return { ...v, liked };
    }
    return v;
  });
  await saveVideos(next);
  return liked;
}

export function formatTime(ms) {
  if (!ms || ms <= 0 || !isFinite(ms)) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}