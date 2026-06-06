import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { submitReport, type Report } from "./lib/api";

export default function App() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function takePhoto() {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      setError("Kamera izni gerekli");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setReport(null);
      setError(null);
    }
  }

  async function sendReport() {
    if (!photoUri) {
      setError("Önce fotoğraf çekin");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let lat = 41.0931;
      let lng = 28.8022;
      const loc = await Location.requestForegroundPermissionsAsync();
      if (loc.granted) {
        const pos = await Location.getCurrentPositionAsync({});
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      const r = await submitReport(photoUri, lat, lng);
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Nöbetçi</Text>
      <Text style={styles.subtitle}>İhlal fotoğrafla → dilekçe üret</Text>

      <TouchableOpacity style={styles.btnPrimary} onPress={takePhoto}>
        <Text style={styles.btnText}>Fotoğraf Çek</Text>
      </TouchableOpacity>

      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
      )}

      <TouchableOpacity
        style={[styles.btnSecondary, !photoUri && styles.btnDisabled]}
        onPress={sendReport}
        disabled={!photoUri || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>İhbar Gönder</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      {report && (
        <ScrollView style={styles.result}>
          <Text style={styles.resultTitle}>{report.violation_label}</Text>
          <Text style={styles.meta}>
            Şiddet: {report.severity.level} ({report.severity.score})
          </Text>
          <Text style={styles.meta}>Kurum: {report.authority?.authority}</Text>
          {report.demo && <Text style={styles.demoBadge}>Demo modu</Text>}
          <Text style={styles.petitionLabel}>Dilekçe</Text>
          <Text style={styles.petition}>{report.petition}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#f8fafc" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginBottom: 24 },
  btnPrimary: {
    backgroundColor: "#059669",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  btnSecondary: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  preview: { width: "100%", height: 200, borderRadius: 12, marginTop: 8 },
  error: { color: "#f87171", marginTop: 12 },
  result: {
    marginTop: 16,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    maxHeight: 280,
  },
  resultTitle: { fontSize: 18, fontWeight: "600", color: "#f1f5f9" },
  meta: { color: "#94a3b8", marginTop: 4, fontSize: 13 },
  demoBadge: { color: "#fbbf24", marginTop: 6, fontSize: 12 },
  petitionLabel: { color: "#e2e8f0", fontWeight: "600", marginTop: 12 },
  petition: { color: "#cbd5e1", fontSize: 12, marginTop: 6, lineHeight: 18 },
});
