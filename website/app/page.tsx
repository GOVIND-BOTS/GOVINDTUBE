"use client";
import { useEffect, useState } from "react";
import { Search, Play, Compass, Flame, Clapperboard, Music2, Gamepad2, UploadCloud } from "lucide-react";
type Video = {id:string;title:string;owner_name?:string;views?:number};
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export default function Home() {
 const [videos,setVideos]=useState<Video[]>([]); const [query,setQuery]=useState(""); const [notice,setNotice]=useState("");
 useEffect(()=>{fetch(API+"/api/v1/videos").then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>setVideos(d.items||[])).catch(()=>setNotice("Connect the GOVIND TUBE API to load community videos."));},[]);
 const visible=videos.filter(v=>v.title.toLowerCase().includes(query.toLowerCase()));
 return <main className="shell"><header className="top"><a className="brand" href="#"><span className="mark"><Play fill="currentColor"/></span> GOVIND <b>TUBE</b></a><div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search videos and creators"/></div><a className="upload" href="#create"><UploadCloud size={17}/> Upload</a><span className="avatar">G</span></header>
 <div className="layout"><aside><a className="active"><Compass/> Discover</a><a><Flame/> Trending</a><a><Clapperboard/> Subscriptions</a><small>EXPLORE</small><a><Music2/> Music</a><a><Gamepad2/> Gaming</a><div className="sidebox">Your next favorite video is waiting.<p>Follow creators and build your own library.</p></div></aside>
 <section className="content"><div className="hero"><div className="eyebrow">A NEW WAY TO WATCH</div><h1>Find your next<br/><em>favorite thing.</em></h1><p>Fresh perspectives. Bold creators. Videos worth your time.</p><button><Play size={15} fill="currentColor"/> Explore videos</button><div className="orb"><Play size={55} fill="currentColor"/></div><span className="tag">WATCH · CREATE · DISCOVER</span></div>
 <div className="heading"><div><small>YOUR DAILY MIX</small><h2>Made to be discovered</h2></div><span>Explore all ↗</span></div>{notice&&<p className="notice">{notice}</p>}
 <div className="grid">{visible.length?visible.map(v=><article key={v.id}><div className="thumb"><span><Play fill="currentColor"/></span></div><h3>{v.title}</h3><p>{v.owner_name||"GOVIND TUBE creator"} · {v.views||0} views</p></article>):<div className="empty"><div>▣</div><h3>The screen is yours.</h3><p>When creators publish videos, you’ll find them here.</p></div>}</div>
 <div className="creator" id="create"><div><small>CREATOR MODE</small><h2>Your story deserves a screen.</h2><p>Build your channel and share your perspective.</p></div><button><UploadCloud/> Create your channel</button></div><footer>© 2026 GOVIND TUBE <span>Made for the curious.</span></footer></section></div></main>;
}
