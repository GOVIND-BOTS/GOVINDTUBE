"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search, Play, Compass, Flame, Clapperboard, Music2, Gamepad2, UploadCloud, X, Eye, Radio, UserRound, LogOut } from "lucide-react";

type Video = { id: string; title: string; description?: string; owner_name?: string; views?: number; stream_url: string; };
type User = { id: string; name: string; email: string; };
type Channel = { username: string; display_name: string; bio: string; subscribers: number; };
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [dialog, setDialog] = useState<"login" | "register" | "upload" | "channel" | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem("govind_tube_token");
    if (saved) {
      setToken(saved);
      fetch(API + "/api/v1/auth/me", { headers: { Authorization: "Bearer " + saved } })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => setUser(data))
        .catch(() => window.sessionStorage.removeItem("govind_tube_token"));
    }
  }, []);

  const loadVideos = () => {
    fetch(API + "/api/v1/videos")
      .then((r) => { if (!r.ok) throw new Error("API request failed"); return r.json(); })
      .then((data) => setVideos(data.items || []))
      .catch(() => setNotice("Connect the GOVIND TUBE API to load community videos."))
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadVideos(); }, []);

  useEffect(() => {
    if (!token) { setChannel(null); return; }
    fetch(API + "/api/v1/channels/me", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setChannel(data.channel))
      .catch(() => setChannel(null));
  }, [token]);

  const visible = useMemo(() => videos.filter((v) => v.title.toLowerCase().includes(query.toLowerCase())), [videos, query]);
  const streamUrl = (video: Video) => video.stream_url.startsWith("http") ? video.stream_url : API + video.stream_url;

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFormError("");
    const form = new FormData(event.currentTarget);
    const mode = dialog === "register" ? "register" : "login";
    const payload = mode === "register"
      ? { name: String(form.get("name") || ""), email: String(form.get("email") || ""), password: String(form.get("password") || "") }
      : { email: String(form.get("email") || ""), password: String(form.get("password") || "") };
    try {
      const response = await fetch(API + "/api/v1/auth/" + mode, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not authenticate");
      if (mode === "register") {
        setDialog("login"); setFormError("Account created. Please sign in."); return;
      }
      window.sessionStorage.setItem("govind_tube_token", data.access_token);
      setToken(data.access_token); setUser(data.user); setDialog(null);
    } catch (error) { setFormError(error instanceof Error ? error.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  async function submitChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFormError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(API + "/api/v1/channels", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ username: form.get("username"), display_name: form.get("display_name"), bio: form.get("bio") || "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not create channel");
      setChannel(data); setDialog(null);
    } catch (error) { setFormError(error instanceof Error ? error.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFormError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(API + "/api/v1/videos/upload", { method: "POST", headers: { Authorization: "Bearer " + token }, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed");
      setDialog(null); setNotice("Your video was uploaded successfully."); setLoading(true); loadVideos();
    } catch (error) { setFormError(error instanceof Error ? error.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  function logout() {
    window.sessionStorage.removeItem("govind_tube_token"); setToken(""); setUser(null); setChannel(null);
  }

  return (
    <main className="shell">
      <header className="top">
        <a className="brand" href="#"><img className="brandLogo" src="/govind-tube-logo.svg" alt="" /> GOVIND <b>TUBE</b></a>
        <div className="search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search videos and creators" aria-label="Search videos" /></div>
        <button className="upload" onClick={() => { setFormError(""); setDialog(token ? "upload" : "login"); }}><UploadCloud size={17} /> Upload</button>
        {user ? <div className="userMenu"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><button className="textAction" onClick={logout}><LogOut size={15} /> Sign out</button></div> : <button className="signIn" onClick={() => { setFormError(""); setDialog("login"); }}><UserRound size={16} /> Sign in</button>}
      </header>

      <div className="layout">
        <aside><a className="active"><Compass /> Discover</a><a><Flame /> Trending</a><a><Clapperboard /> Subscriptions</a><small>EXPLORE</small><a><Music2 /> Music</a><a><Gamepad2 /> Gaming</a><div className="sidebox">Your next favorite video is waiting.<p>Follow creators and build your own library.</p></div></aside>
        <section className="content">
          <div className="hero"><div className="eyebrow">A NEW WAY TO WATCH</div><h1>Find your next<br /><em>favorite thing.</em></h1><p>Fresh perspectives. Bold creators. Videos worth your time.</p><a className="heroAction" href="#videos"><Play size={15} fill="currentColor" /> Explore videos</a><div className="orb"><Play size={55} fill="currentColor" /></div><span className="tag">WATCH · CREATE · DISCOVER</span></div>
          <div className="heading" id="videos"><div><small>YOUR DAILY MIX</small><h2>Made to be discovered</h2></div><span><Radio size={14} /> {videos.length} videos</span></div>
          {notice && <p className="notice">{notice}</p>}
          <div className="grid">
            {visible.map((video) => <button className="videoCard" key={video.id} onClick={() => setSelected(video)}><div className="thumb"><span><Play fill="currentColor" /></span><small><Eye size={12} /> {(video.views || 0).toLocaleString()} views</small></div><h3>{video.title}</h3><p>{video.owner_name || "GOVIND TUBE creator"}</p></button>)}
            {!loading && visible.length === 0 && <div className="empty"><div>▣</div><h3>{query ? "No matching videos yet." : "The screen is yours."}</h3><p>{query ? "Try another search." : "When creators publish videos, you’ll find them here."}</p></div>}
            {loading && <div className="empty"><div>◌</div><h3>Finding something good…</h3><p>Loading the latest videos.</p></div>}
          </div>
          <div className="creator" id="create"><div><small>CREATOR MODE</small><h2>{channel ? channel.display_name : "Your story deserves a screen."}</h2><p>{channel ? "@" + channel.username + " · " + channel.subscribers + " subscribers" : "Build your channel and share your perspective."}</p></div><button onClick={() => { setFormError(""); setDialog(token ? (channel ? "upload" : "channel") : "register"); }}>{channel ? <UploadCloud /> : <UserRound />} {channel ? "Upload a video" : "Create your channel"}</button></div>
          <footer>© 2026 GOVIND TUBE <span>Made for the curious. · <a href="/privacy">Privacy policy</a></span></footer>
        </section>
      </div>

      {selected && <div className="playerBackdrop" onClick={() => setSelected(null)}><section className="playerDialog" role="dialog" aria-modal="true" aria-label={selected.title} onClick={(e) => e.stopPropagation()}><div className="playerTop"><strong>{selected.title}</strong><button onClick={() => setSelected(null)} aria-label="Close player"><X /></button></div><video key={selected.id} controls autoPlay playsInline preload="metadata" src={streamUrl(selected)} /><div className="playerInfo"><h2>{selected.title}</h2><p>{selected.owner_name || "GOVIND TUBE creator"} · {(selected.views || 0).toLocaleString()} views</p>{selected.description && <p>{selected.description}</p>}</div></section></div>}

      {dialog && <div className="modalBackdrop" onClick={() => !busy && setDialog(null)}><section className="formDialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}><div className="formDialogTop"><div><small>GOVIND TUBE</small><h2>{dialog === "login" ? "Welcome back" : dialog === "register" ? "Create your account" : dialog === "channel" ? "Create your channel" : "Upload a video"}</h2></div><button onClick={() => setDialog(null)} aria-label="Close"><X /></button></div>
        {formError && <p className="formMessage">{formError}</p>}
        {(dialog === "login" || dialog === "register") && <form onSubmit={submitAuth} className="appForm">{dialog === "register" && <label>Your name<input name="name" minLength={2} maxLength={60} required placeholder="Creator name" /></label>}<label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" minLength={8} maxLength={72} required placeholder="At least 8 characters" /></label><button disabled={busy}>{busy ? "Please wait…" : dialog === "login" ? "Sign in" : "Create account"}</button><p>{dialog === "login" ? "New to GOVIND TUBE? " : "Already have an account? "}<button type="button" className="inlineAction" onClick={() => { setFormError(""); setDialog(dialog === "login" ? "register" : "login"); }}>{dialog === "login" ? "Create account" : "Sign in"}</button></p></form>}
        {dialog === "channel" && <form onSubmit={submitChannel} className="appForm"><label>Channel name<input name="display_name" required minLength={2} maxLength={60} placeholder="My creator channel" /></label><label>Username<input name="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" placeholder="creator_name" /></label><label>Bio<textarea name="bio" maxLength={500} placeholder="Tell viewers about your channel" /></label><button disabled={busy}>{busy ? "Creating…" : "Create channel"}</button></form>}
        {dialog === "upload" && <form onSubmit={submitUpload} className="appForm"><label>Video title<input name="title" required minLength={2} maxLength={120} placeholder="Give your video a title" /></label><label>Description<textarea name="description" maxLength={5000} placeholder="What is this video about?" /></label><label>Video file<input name="file" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" required /></label><p className="formHint">MP4, WebM or MOV. Maximum upload size is controlled by the server.</p><button disabled={busy}>{busy ? "Uploading…" : "Publish video"}</button></form>}
      </section></div>}
    </main>
  );
}
