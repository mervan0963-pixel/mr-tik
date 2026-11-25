import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { addVideo } from './store';

export default function AddScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const pickVideo = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const asset = result.assets ? result.assets[0] : result;

      if (!asset || !asset.uri) {
        throw new Error('لم يتم العثور على رابط الملف');
      }

      await addVideo(asset.uri, asset.name || 'فيديو جديد');

      setLoading(false);
      Alert.alert('نجاح ✅', 'تم إضافة الفيديو بنجاح!', [
        { text: 'شاهد الآن', onPress: () => navigation.navigate('Feed') }
      ]);

    } catch (e) {
      setLoading(false);
      console.error('Pick Error:', e);
      Alert.alert('خطأ ❌', 'تعذر إضافة الفيديو. التفاصيل: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>إضافة فيديو</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>اختر فيديو من هاتفك لإضافته لتطبيق mr tik</Text>

        <TouchableOpacity
          style={[styles.pickBtn, loading && styles.disabled]}
          onPress={pickVideo}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.pickText}>📂 اختر فيديو من الملفات</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.info}>سيتم حفظ الفيديو داخل التطبيق ليعمل بدون إنترنت.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  backBtn: {
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  content: { flex: 1, justifyContent: 'center', padding: 30 },
  hint: { color: '#aaa', textAlign: 'center', marginBottom: 30, fontSize: 16 },
  pickBtn: {
    backgroundColor: '#fe2c55',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
  },
  pickText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabled: { opacity: 0.6 },
  info: { color: '#555', textAlign: 'center', marginTop: 20, fontSize: 12 },
});