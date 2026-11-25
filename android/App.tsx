import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";
import { VideoView, useVideoPlayer } from "expo-video";

const API = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000").replace(/\/$/, "");
type User = { id: string; name: string; email: string };
type Video = { id: string; title: string; description?: string; owner_name?: string; views?: number; stream_url: string };
type Channel = { username: string; display_name: string; subscribers: number };
type Screen = "home" | "auth" | "channel" | "upload" | "watch";
type Mode = "login" | "register";

function Player({ video, onClose }: { video: Video; onClose: () => void }) {
  const uri = video.stream_url.startsWith("http") ? video.stream_url : API + video.stream_url;
  const player = useVideoPlayer(uri, (instance) => { instance.play(); });
  return <View style={styles.playerBox}><VideoView player={player} style={styles.video} nativeControls contentFit="contain" /><Text style={styles.videoTitle}>{video.title}</Text><Text style={styles.muted}>{video.owner_name || "GOVIND TUBE creator"}</Text><Pressable style={styles.secondary} onPress={onClose}><Text style={styles.buttonText}>Back to videos</Text></Pressable></View>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("login");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [selected, setSelected] = useState<Video | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [channelName, setChannelName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadVideos = useCallback(async () => {
    try {
      const response = await fetch(API + "/api/v1/videos");
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not load videos");
      setVideos(data.items || []);
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not connect to GOVIND TUBE API");
    }
  }, []);

  const loadChannel = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(API + "/api/v1/channels/me", { headers: { Authorization: "Bearer " + authToken } });
      const data = await response.json();
      if (response.ok) setChannel(data.channel);
    } catch { setChannel(null); }
  }, []);

  useEffect(() => {
    loadVideos();
    SecureStore.getItemAsync("govind_tube_token").then(async (saved) => {
      if (!saved) return;
      try {
        const response = await fetch(API + "/api/v1/auth/me", { headers: { Authorization: "Bearer " + saved } });
        if (!response.ok) throw new Error("Session expired");
        const profile = await response.json();
        setToken(saved); setUser(profile); await loadChannel(saved);
      } catch { await SecureStore.deleteItemAsync("govind_tube_token"); }
    });
  }, [loadVideos, loadChannel]);

  async function authenticate() {
    if (!email.trim() || !password) return Alert.alert("Missing details", "Enter your email and password.");
    if (mode === "register" && name.trim().length < 2) return Alert.alert("Name required", "Enter your name.");
    setBusy(true);
    try {
      const response = await fetch(API + "/api/v1/auth/" + mode, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Authentication failed");
      if (mode === "register") {
        Alert.alert("Account created", "Please sign in with your new account.");
        setMode("login"); setPassword(""); return;
      }
      await SecureStore.setItemAsync("govind_tube_token", data.access_token);
      setToken(data.access_token); setUser(data.user); await loadChannel(data.access_token);
      setPassword(""); setScreen("home");
    } catch (error) { Alert.alert("GOVIND TUBE", error instanceof Error ? error.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  async function createChannel() {
    setBusy(true);
    try {
      const response = await fetch(API + "/api/v1/channels", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ username: username.trim(), display_name: channelName.trim(), bio: bio.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not create channel");
      setChannel(data); setScreen("home");
    } catch (error) { Alert.alert("Channel", error instanceof Error ? error.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  async function uploadVideo() {
    if (!token) return setScreen("auth");
    if (title.trim().length < 2) return Alert.alert("Title required", "Add a video title.");
    const picked = await DocumentPicker.getDocumentAsync({ type: ["video/mp4", "video/webm", "video/quicktime"], copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    const body = new FormData();
    body.append("title", title.trim());
    body.append("description", description.trim());
    body.append("file", { uri: asset.uri, name: asset.name || "upload.mp4", type: asset.mimeType || "video/mp4" } as unknown as Blob);
    setBusy(true);
    try {
      const response = await fetch(API + "/api/v1/videos/upload", { method: "POST", headers: { Authorization: "Bearer " + token }, body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed");
      Alert.alert("Published", "Your video is now available on GOVIND TUBE.");
      setTitle(""); setDescription(""); setScreen("home"); await loadVideos();
    } catch (error) { Alert.alert("Upload", error instanceof Error ? error.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  async function signOut() {
    await SecureStore.deleteItemAsync("govind_tube_token");
    setToken(""); setUser(null); setChannel(null); setNotice("You have signed out.");
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#090711" />
      <View style={styles.header}>
        <Text style={styles.logo}>▶</Text>
        <Text style={styles.brand}>GOVIND <Text style={{ color: "#c084fc" }}>TUBE</Text></Text>
        {user ? <Text style={styles.userBadge}>{user.name.slice(0, 1).toUpperCase()}</Text> : <Pressable onPress={() => { setMode("login"); setScreen("auth"); }}><Text style={styles.headerAction}>Sign in</Text></Pressable>}
      </View>

      {screen === "home" && <FlatList
        data={videos} keyExtractor={(item) => item.id} refreshing={busy} onRefresh={loadVideos}
        ListHeaderComponent={<View>
          <View style={styles.hero}><Text style={styles.eyebrow}>A NEW WAY TO WATCH</Text><Text style={styles.title}>Find your next{"\n"}<Text style={{ color: "#d8a4ff" }}>favorite thing.</Text></Text><Text style={styles.sub}>Fresh perspectives. Bold creators. Videos worth your time.</Text><Pressable style={styles.primary} onPress={() => setScreen(token ? (channel ? "upload" : "channel") : "auth")}><Text style={styles.buttonText}>＋  Create your channel</Text></Pressable></View>
          <View style={styles.sectionRow}><View><Text style={styles.eyebrow}>YOUR DAILY MIX</Text><Text style={styles.heading}>Made to be discovered</Text></View><Pressable onPress={loadVideos}><Text style={styles.headerAction}>Refresh</Text></Pressable></View>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {user ? <View style={styles.accountRow}><Text style={styles.muted}>Signed in as {user.name}{channel ? " · @" + channel.username : ""}</Text><Pressable onPress={signOut}><Text style={styles.headerAction}>Sign out</Text></Pressable></View> : null}
        </View>}
        renderItem={({ item }) => <Pressable style={styles.videoCard} onPress={() => { setSelected(item); setScreen("watch"); }}><View style={styles.thumbnail}><Text style={{ fontSize: 28, color: "#f5d0fe" }}>▶</Text></View><Text style={styles.videoTitle}>{item.title}</Text><Text style={styles.muted}>{item.owner_name || "GOVIND TUBE creator"} · {item.views || 0} views</Text></Pressable>}
        ListEmptyComponent={<View style={styles.empty}><Text style={{ color: "#c084fc", fontSize: 28 }}>▣</Text><Text style={styles.emptyTitle}>The screen is yours.</Text><Text style={styles.muted}>Videos from creators will appear here.</Text></View>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />}

      {screen === "auth" && <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.formWrap}><ScrollView keyboardShouldPersistTaps="handled"><Text style={styles.eyebrow}>GOVIND TUBE ACCOUNT</Text><Text style={styles.heading}>{mode === "login" ? "Welcome back" : "Create your account"}</Text>{mode === "register" && <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#897a9a" value={name} onChangeText={setName} /> }<TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#897a9a" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password (8+ characters)" placeholderTextColor="#897a9a" secureTextEntry value={password} onChangeText={setPassword} /><Pressable style={styles.primary} onPress={authenticate} disabled={busy}><Text style={styles.buttonText}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Text></Pressable><Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}><Text style={styles.switchText}>{mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}</Text></Pressable><Pressable onPress={() => setScreen("home")}><Text style={styles.switchText}>Back to home</Text></Pressable></ScrollView></KeyboardAvoidingView>}

      {screen === "channel" && <ScrollView style={styles.formWrap} keyboardShouldPersistTaps="handled"><Text style={styles.eyebrow}>CREATOR MODE</Text><Text style={styles.heading}>Create your channel</Text><TextInput style={styles.input} placeholder="Channel display name" placeholderTextColor="#897a9a" value={channelName} onChangeText={setChannelName} /><TextInput style={styles.input} placeholder="Username (letters, numbers, _)" placeholderTextColor="#897a9a" autoCapitalize="none" value={username} onChangeText={setUsername} /><TextInput style={[styles.input, styles.multiline]} placeholder="Tell viewers about your channel" placeholderTextColor="#897a9a" multiline value={bio} onChangeText={setBio} /><Pressable style={styles.primary} onPress={createChannel} disabled={busy}><Text style={styles.buttonText}>{busy ? "Creating…" : "Create channel"}</Text></Pressable></ScrollView>}

      {screen === "upload" && <ScrollView style={styles.formWrap} keyboardShouldPersistTaps="handled"><Text style={styles.eyebrow}>SHARE YOUR STORY</Text><Text style={styles.heading}>Upload a video</Text><TextInput style={styles.input} placeholder="Video title" placeholderTextColor="#897a9a" value={title} onChangeText={setTitle} /><TextInput style={[styles.input, styles.multiline]} placeholder="Description" placeholderTextColor="#897a9a" multiline value={description} onChangeText={setDescription} /><Pressable style={styles.primary} onPress={uploadVideo} disabled={busy}><Text style={styles.buttonText}>{busy ? "Uploading…" : "Choose video & publish"}</Text></Pressable><Text style={styles.muted}>MP4, WebM and MOV are supported by the API.</Text></ScrollView>}

      {screen === "watch" && selected && <ScrollView style={styles.formWrap}><Player video={selected} onClose={() => { setSelected(null); setScreen("home"); }} /></ScrollView>}

      <View style={styles.nav}><Pressable onPress={() => setScreen("home")}><Text style={styles.navText}>⌂{"\n"}Home</Text></Pressable><Pressable onPress={() => setScreen("home")}><Text style={styles.navText}>⌕{"\n"}Explore</Text></Pressable><Pressable onPress={() => setScreen(token ? (channel ? "upload" : "channel") : "auth")}><Text style={styles.navText}>＋{"\n"}Create</Text></Pressable><Pressable onPress={() => setScreen(user ? "channel" : "auth")}><Text style={styles.navText}>◉{"\n"}Account</Text></Pressable></View>
      {busy && <View style={styles.loading}><ActivityIndicator color="#d8a4ff" /></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090711", paddingHorizontal: 16, paddingTop: 8 },
  header: { height: 48, flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { color: "#fff", backgroundColor: "#9333ea", overflow: "hidden", padding: 8, borderRadius: 9 },
  brand: { color: "#fff", fontSize: 17, fontWeight: "900", flex: 1 },
  userBadge: { color: "#fff", backgroundColor: "#9333ea", textAlign: "center", textAlignVertical: "center", width: 32, height: 32, borderRadius: 16, fontWeight: "900" },
  headerAction: { color: "#d8a4ff", fontSize: 12, fontWeight: "800", padding: 8 },
  hero: { marginTop: 18, marginBottom: 24, padding: 22, minHeight: 260, borderRadius: 20, backgroundColor: "#28123f", overflow: "hidden" },
  eyebrow: { color: "#c49be9", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginTop: 16 },
  title: { fontSize: 35, lineHeight: 40, color: "#fff", fontWeight: "900", marginTop: 12 },
  sub: { color: "#b9a8cc", fontSize: 12, lineHeight: 18, marginTop: 10, maxWidth: 245 },
  primary: { alignSelf: "flex-start", backgroundColor: "#9333ea", padding: 13, borderRadius: 9, marginTop: 17 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  heading: { fontSize: 23, color: "#fff", fontWeight: "900", marginTop: 6, marginBottom: 15 },
  notice: { color: "#e9d5ff", backgroundColor: "#9333ea22", padding: 12, borderRadius: 9, fontSize: 12, marginBottom: 12 },
  accountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  videoCard: { marginBottom: 22 },
  thumbnail: { aspectRatio: 16 / 9, borderRadius: 13, backgroundColor: "#211333", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ffffff18" },
  videoTitle: { color: "#fff", fontWeight: "800", fontSize: 14, marginTop: 9 },
  muted: { color: "#a99bbd", fontSize: 11, marginTop: 5, lineHeight: 17 },
  empty: { borderWidth: 1, borderStyle: "dashed", borderColor: "#8b35d555", borderRadius: 15, alignItems: "center", padding: 25, marginTop: 10 },
  emptyTitle: { color: "#fff", fontWeight: "800", marginTop: 8 },
  formWrap: { flex: 1, paddingTop: 18 },
  input: { backgroundColor: "#171020", borderWidth: 1, borderColor: "#ffffff25", borderRadius: 10, color: "#fff", padding: 14, marginBottom: 12, fontSize: 14 },
  multiline: { minHeight: 95, textAlignVertical: "top" },
  switchText: { color: "#d8a4ff", textAlign: "center", padding: 12, fontSize: 12, fontWeight: "700" },
  nav: { height: 58, borderTopWidth: 1, borderTopColor: "#ffffff18", flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  navText: { color: "#c8b9d9", fontSize: 11, textAlign: "center", lineHeight: 17 },
  playerBox: { paddingTop: 15 },
  video: { width: "100%", height: 230, backgroundColor: "#000", borderRadius: 12 },
  secondary: { backgroundColor: "#30203f", alignSelf: "flex-start", borderRadius: 8, padding: 12, marginTop: 16 },
  loading: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "#0005", alignItems: "center", justifyContent: "center" },
});
