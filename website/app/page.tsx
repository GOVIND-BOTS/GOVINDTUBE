"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Play, Compass, Flame, Clapperboard, Music2, Gamepad2, UploadCloud, X, Eye, Radio } from "lucide-react";

type Video = {
  id: string;
  title: string;
  description?: string;
  owner_name?: string;
  views?: number;
  created_at?: string;
  stream_url: string;
};
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(API + "/api/v1/videos")
      .then((r) => { if (!r.ok) throw new Error("API request failed"); return r.json(); })
      .then((data) => { if (active) setVideos(data.items || []); })
      .catch(() => { if (active) setNotice("Connect the GOVIND TUBE API to load community videos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(
    () => videos.filter((v) => v.title.toLowerCase().includes(query.toLowerCase())),
    [videos, query],
  );
  const streamUrl = (video: Video) =>
    video.stream_url.startsWith("http") ? video.stream_url : API + video.stream_url;

  return (
    <main className="shell">
      <header className="top">
        <a className="brand" href="#"><img className="brandLogo" src="/govind-tube-logo.svg" alt="" /> GOVIND <b>TUBE</b></a>
        <div className="search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search videos and creators" aria-label="Search videos" /></div>
        <a className="upload" href="#create"><UploadCloud size={17} /> Upload</a>
        <span className="avatar">G</span>
      </header>

      <div className="layout">
        <aside>
          <a className="active"><Compass /> Discover</a><a><Flame /> Trending</a><a><Clapperboard /> Subscriptions</a>
          <small>EXPLORE</small><a><Music2 /> Music</a><a><Gamepad2 /> Gaming</a>
          <div className="sidebox">Your next favorite video is waiting.<p>Follow creators and build your own library.</p></div>
        </aside>

        <section className="content">
          <div className="hero">
            <div className="eyebrow">A NEW WAY TO WATCH</div>
            <h1>Find your next<br /><em>favorite thing.</em></h1>
            <p>Fresh perspectives. Bold creators. Videos worth your time.</p>
            <a className="heroAction" href="#videos"><Play size={15} fill="currentColor" /> Explore videos</a>
            <div className="orb"><Play size={55} fill="currentColor" /></div>
            <span className="tag">WATCH · CREATE · DISCOVER</span>
          </div>

          <div className="heading" id="videos"><div><small>YOUR DAILY MIX</small><h2>Made to be discovered</h2></div><span><Radio size={14} /> {videos.length} videos</span></div>
          {notice && <p className="notice">{notice}</p>}
          <div className="grid">
            {visible.map((video) => (
              <button className="videoCard" key={video.id} onClick={() => setSelected(video)}>
                <div className="thumb"><span><Play fill="currentColor" /></span><small><Eye size={12} /> {(video.views || 0).toLocaleString()} views</small></div>
                <h3>{video.title}</h3>
                <p>{video.owner_name || "GOVIND TUBE creator"}</p>
              </button>
            ))}
            {!loading && visible.length === 0 && (
              <div className="empty"><div>▣</div><h3>{query ? "No matching videos yet." : "The screen is yours."}</h3><p>{query ? "Try another search." : "When creators publish videos, you’ll find them here."}</p></div>
            )}
            {loading && <div className="empty"><div>◌</div><h3>Finding something good…</h3><p>Loading the latest videos.</p></div>}
          </div>

          <div className="creator" id="create"><div><small>CREATOR MODE</small><h2>Your story deserves a screen.</h2><p>Build your channel and share your perspective.</p></div><a href="#videos"><UploadCloud /> Explore creator videos</a></div>
          <footer>© 2026 GOVIND TUBE <span>Made for the curious.</span></footer>
        </section>
      </div>

      {selected && (
        <div className="playerBackdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="playerDialog" role="dialog" aria-modal="true" aria-label={selected.title} onClick={(e) => e.stopPropagation()}>
            <div className="playerTop"><strong>{selected.title}</strong><button onClick={() => setSelected(null)} aria-label="Close player"><X /></button></div>
            <video key={selected.id} controls autoPlay playsInline preload="metadata" src={streamUrl(selected)} />
            <div className="playerInfo"><h2>{selected.title}</h2><p>{selected.owner_name || "GOVIND TUBE creator"} · {(selected.views || 0).toLocaleString()} views</p>{selected.description && <p>{selected.description}</p>}</div>
          </section>
        </div>
      )}
    </main>
  );
}
