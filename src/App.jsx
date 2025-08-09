import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "./firebase";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";

/* ——— AYARLAR ——— */
const config = {
  couple: { you: "Ensar", partner: "Zehra" },
  cityYou: "Batman",
  cityPartner: "Antalya",
  anniversary: "2025-04-12",        // sevgililik: 12 Nisan (GELECEK yıla göre geri sayılacak)
  nextMeet: "2025-08-21T18:00:00",  // buluşma: 21 Ağustos 18:00
  ensarBday:  { mmdd: "08-07", label: "Ensar’ın Doğum Günü 🎂" },
  zehraBday:  { mmdd: "09-23", label: "Zehra’nın Doğum Günü 🎂" },
  // MP3'ü public/song.mp3 olarak koy
  songSrc: import.meta.env.BASE_URL + "song.mp3",
};

/* ——— ORTAK ——— */
function daysBetween(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
function useCountdown(targetISO) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const t = new Date(targetISO).getTime();
    const tick = () => setLeft(Math.max(0, t - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetISO]);
  const s = Math.floor(left / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}
function nextOccurrence(mmdd) {
  const now = new Date();
  const [m, d] = mmdd.split("-").map(Number);
  const thisYearDate = new Date(`${now.getFullYear()}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T00:00:00`);
  if (thisYearDate.getTime() >= new Date(now.toDateString()).getTime()) {
    return thisYearDate;
  }
  return new Date(`${now.getFullYear()+1}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T00:00:00`);
}

/* ——— KALP YAĞMURU ——— */
function HeartsRain() {
  const hearts = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((_, i) => (
        <span
          key={i}
          className="absolute text-pink-400/70 animate-heart-fall select-none"
          style={{
            left: `${(i * 7) % 100}%`,
            animationDelay: `${(i % 9) * 0.5}s`,
            fontSize: `${12 + (i % 6) * 6}px`,
            top: -40,
          }}
        >
          ❤
        </span>
      ))}
    </div>
  );
}

/* ——— GECE/GÜNDÜZ YILDIZ ALANI ——— */
function StarField({ show }) {
  if (!show) return null;
  const stars = useMemo(() => Array.from({ length: 70 }), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((_, i) => (
        <span
          key={i}
          className="absolute star-twinkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.6 + Math.random() * 0.4,
            transform: `scale(${0.6 + Math.random() * 0.8})`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

/* ——— GİRİŞ (kalp patlamalı) ——— */
function Login({ onLogin, onSuccessBurst }) {
  const [pw, setPw] = useState("");
  const handle = (e) => {
    e.preventDefault();
    if (pw === "zehra123") { onLogin({ name: "Zehra 👸", role: "zehra" }); onSuccessBurst?.(); }
    else if (pw === "ensar123") { onLogin({ name: "Ensar", role: "ensar" }); onSuccessBurst?.(); }
    else alert("Şifre yanlış!");
  };
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-3xl backdrop-blur-md bg-white/70 dark:bg-zinc-900/40 shadow-xl p-8 sm:p-10 text-center w-full max-w-md"
    >
      <div className="mx-auto inline-flex items-center gap-2 text-sm opacity-80">
        <span>{config.cityYou} ⇄ {config.cityPartner} • Uzak Mesafe</span>
      </div>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Ensar ❤️ Zehra</h1>
      <form onSubmit={handle} className="mt-6 grid gap-3">
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Şifre"
          className="rounded-2xl px-4 py-3 bg-white/80 dark:bg-zinc-800/70 border border-pink-200/60 outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-md bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white hover:opacity-95"
        >
          Giriş Yap
        </button>
      </form>
    </motion.section>
  );
}

/* ——— GİRİŞ BAŞARISINDA KALP PATLAMASI ——— */
function HeartBurst() {
  const [bursts, setBursts] = useState([]);
  const spawn = () => {
    const b = Array.from({ length: 22 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      x: (Math.random() - 0.5) * 240,
      y: (Math.random() - 0.5) * 240,
      r: Math.random() * 360,
      s: 0.8 + Math.random() * 1.2
    }));
    setBursts(b);
    setTimeout(() => setBursts([]), 1200);
  };
  return { view: (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <AnimatePresence>
        {bursts.map(h => (
          <motion.span
            key={h.id}
            initial={{ opacity: 0, scale: 0.2, x: 0, y: 0, rotate: 0 }}
            animate={{ opacity: 1, scale: h.s, x: h.x, y: h.y, rotate: h.r }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl sm:text-4xl select-none"
            style={{ color: "rgba(236,72,153,0.9)" }}
          >
            ❤
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  ), spawn };
}

/* ——— MÜZİK ÇALAR ——— */
function formatTime(s) {
  if (!isFinite(s)) return "00:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function AudioPlayer({ src, title = "Ortak Şarkımız" }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [loop, setLoop] = useState(false);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); }
  };
  const stop = () => { const a = audioRef.current; if (!a) return; a.pause(); a.currentTime = 0; setPlaying(false); };
  const onLoaded = () => { const a = audioRef.current; if (!a) return; setDuration(a.duration || 0); a.volume = volume; a.loop = loop; };
  const onTime = () => { const a = audioRef.current; if (!a) return; setCurrent(a.currentTime || 0); };
  const seek = (e) => {
    const a = audioRef.current; if (!a) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * (a.duration || 0);
    setCurrent(a.currentTime);
  };
  const changeVolume = (e) => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; };
  const toggleLoop = () => { const a = audioRef.current; if (!a) return; a.loop = !loop; setLoop(a.loop); };

  return (
    <div className="mt-8 w-full max-w-2xl rounded-3xl border border-white/20 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow">
      <audio ref={audioRef} src={src} onLoadedMetadata={onLoaded} onTimeUpdate={onTime} preload="metadata" />
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">{title}</div>
        <div className="text-xs opacity-70">{formatTime(current)} / {formatTime(duration)}</div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-black/10 dark:bg-white/10 cursor-pointer" onClick={seek}>
        <div className="h-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500"
          style={{ width: duration ? `${(current / duration) * 100}%` : "0%" }} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={toggle} className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 shadow hover:opacity-95">
          {playing ? "Pause" : "Play"}
        </button>
        <button onClick={stop} className="rounded-2xl px-4 py-2 text-sm font-semibold border border-white/30 bg-white/70 dark:bg-zinc-800/60">Stop</button>
        <label className="flex items-center gap-2 text-sm opacity-80 ml-2">Ses
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={changeVolume} className="w-28" />
        </label>
        <button onClick={toggleLoop}
          className={`rounded-2xl px-3 py-2 text-sm font-semibold border ${loop ? "border-pink-400 text-pink-600" : "border-white/30"}`} title="Döngü">
          {loop ? "Loop: Açık" : "Loop: Kapalı"}
        </button>
      </div>
    </div>
  );
}

/* ——— NOT DEFTERİ (UID kilit) ——— */
function Notes({ currentUser }) {
  const COL = "notes";
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(arr);
    });
    return () => unsub();
  }, []);

  const add = async () => {
    const t = text.trim();
    if (!t) return;
    await addDoc(collection(db, COL), {
      t,
      author: currentUser.name,   // "Zehra 👸" / "Ensar"
      role: currentUser.role,     // "zehra" / "ensar"
      uid: auth.currentUser?.uid || null, // UID kilidi
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  const del = async (id) => { await deleteDoc(doc(db, COL, id)); };

  const visible = items.filter((n) => !!n.author);

  return (
    <section className="mt-8 w-full max-w-2xl">
      <div className="rounded-3xl border border-white/20 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow">
        <h3 className="font-semibold mb-3">Mini Not Defteri (canlı)</h3>
        {/* \uD83D\uDCF1 Mobil uyum: input + buton yatay grid */}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Bugün ona ne söylemek istersin?"
            className="w-full rounded-2xl px-4 py-2 bg-white/80 dark:bg-zinc-800/70 border border-pink-200/60 outline-none focus:ring-2 focus:ring-pink-300" />
          <button onClick={add}
            className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-md bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white hover:opacity-95">
            Ekle
          </button>
        </div>

        <ul className="mt-4 grid gap-2">
          {visible.map((n) => (
            <li key={n.id}
              className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2 ${
                n.role === "zehra" ? "bg-pink-50/80 border-pink-200/60" : "bg-blue-50/80 border-blue-200/60"
              }`}>
              <div className="pr-2">
                <div className="text-sm font-semibold">{n.author}</div>
                <div className="opacity-90">{n.t}</div>
                <div className="text-[11px] opacity-60 mt-1">
                  {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleString() : "—"}
                </div>
              </div>
              {(n.uid && auth.currentUser?.uid === n.uid) && (
                <button onClick={() => del(n.id)} className="text-pink-600 hover:underline text-sm" title="Sil (sadece kendi notun)">Sil</button>
              )}
            </li>
          ))}
          {visible.length === 0 && <li className="text-sm opacity-60">Henüz not yok.</li>}
        </ul>
      </div>
    </section>
  );
}

/* ——— AŞK MEKTUBU MODAL ——— */
function LoveLetterModal({ open, onClose, currentUser }) {
  const [text, setText] = useState("");
  const save = async () => {
    const t = text.trim();
    if (!t) return;
    await addDoc(collection(db, "letters"), {
      t,
      author: currentUser.name,
      role: currentUser.role,
      uid: auth.currentUser?.uid || null,
      createdAt: serverTimestamp(),
    });
    setText("");
    onClose?.();
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-[90%] max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl"
          >
            <div className="text-xl font-bold mb-3">Aşk Mektubu 💌</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Bugünlük mektubun..."
              rows={8}
              className="w-full rounded-2xl border p-3 bg-white/80 dark:bg-zinc-800/70 outline-none focus:ring-2 focus:ring-pink-300"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-2xl px-4 py-2 border">Kapat</button>
              <button onClick={save} className="rounded-2xl px-4 py-2 text-white bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500">Kaydet</button>
            </div>
            <div className="mt-2 text-xs opacity-60">Kaydedildiğinde otomatik tarih eklenir.</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ——— AŞK MEKTUPLARI LİSTESİ ——— */
function Letters({ currentUser }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "letters"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const del = async (id) => { await deleteDoc(doc(db, "letters", id)); };

  return (
    <section className="mt-8 w-full max-w-2xl">
      <div className="rounded-3xl border border-white/20 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow">
        <h3 className="font-semibold mb-3">💌 Aşk Mektupları</h3>
        <ul className="grid gap-3">
          {items.length === 0 && <li className="text-sm opacity-60">Henüz mektup yok.</li>}
          {items.map((m) => (
            <li key={m.id} className="rounded-xl border px-4 py-3 bg-white/80 dark:bg-zinc-800/60">
              <div className="text-sm font-semibold mb-1">{m.author}</div>
              <div className="whitespace-pre-wrap">{m.t}</div>
              <div className="text-[11px] opacity-60 mt-2">
                {m.createdAt?.toDate ? new Date(m.createdAt.toDate()).toLocaleString() : "—"}
              </div>
              {(m.uid && auth.currentUser?.uid === m.uid) && (
                <div className="mt-2">
                  <button onClick={() => del(m.id)} className="text-pink-600 hover:underline text-sm">
                    Sil (sadece kendi mektubun)
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ——— ÖZEL GÜN KARTLARI ——— */
function SpecialCards() {
  // Yıldönümü: config.anniversary -> AY/GÜN alınır, bir SONRAKİ oluşum geri sayılır
  const ann = useCountdown(
    (() => {
      const dt = new Date(config.anniversary);
      const mmdd = `${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
      return nextOccurrence(mmdd).toISOString();
    })()
  );
  const meet = useCountdown(config.nextMeet);
  const ensar = useCountdown(nextOccurrence(config.ensarBday.mmdd).toISOString());
  const zehra = useCountdown(nextOccurrence(config.zehraBday.mmdd).toISOString());

  const Card = ({ title, c }) => (
    <div className="rounded-2xl border bg-white/70 dark:bg-zinc-800/60 px-4 py-3">
      <div className="font-semibold">{title}</div>
      <div className="text-sm opacity-80">
        {c.days}g {c.hours}s {c.minutes}d {c.seconds}sn
      </div>
    </div>
  );
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
      <Card title="Yıldönümüne" c={ann} />
      <Card title="Buluşmaya" c={meet} />
      <Card title={config.ensarBday.label} c={ensar} />
      <Card title={config.zehraBday.label} c={zehra} />
    </div>
  );
}

/* ——— ANA ——— */
export default function App() {
  // localStorage YOK → yenileyince tekrar giriş ister
  const [user, setUser] = useState(null);
  const togetherDays = daysBetween(new Date(config.anniversary), new Date());
  const countdown = useCountdown(config.nextMeet);
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;

  const { view: burstView, spawn: spawnBurst } = HeartBurst();
  const [letterOpen, setLetterOpen] = useState(false);

  return (
    <div className={`relative min-h-screen overflow-hidden ${isNight
      ? "bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100"
      : "bg-gradient-to-b from-pink-50 via-rose-50 to-fuchsia-50 text-zinc-800"}`}>
      {/* arka plan blobları + efektler */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-pink-400/30 to-fuchsia-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-rose-400/30 to-amber-400/30 blur-3xl" />
      <HeartsRain />
      <StarField show={isNight} />
      {burstView}

      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        {!user ? (
          <Login onLogin={setUser} onSuccessBurst={spawnBurst} />
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-3xl rounded-3xl backdrop-blur-md bg-white/70 dark:bg-zinc-900/40 shadow-xl p-6 sm:p-10"
          >
            <div className="text-center">
              <div className="text-sm opacity-80">
                {config.cityYou} ⇄ {config.cityPartner} • Uzak Mesafe Aşkı
              </div>
              <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold">
                {config.couple.you} ❤️ {config.couple.partner} 👸
              </h2>
              <p className="mt-3 text-lg opacity-90">
                {togetherDays} gündür birlikteyiz. Bir sonraki buluşmaya{" "}
                <b>{countdown.days}g {countdown.hours}s {countdown.minutes}d {countdown.seconds}sn</b> kaldı.
              </p>

              {/* Müzik Çalar */}
              {config.songSrc && <AudioPlayer src={config.songSrc} title="Ortak Şarkımız" />}

              {/* Özel Gün Kartları */}
              <SpecialCards />

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setLetterOpen(true)}
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-md bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50"
                >
                  💌 Aşk Mektubu Yaz
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(config.cityYou)}&destination=${encodeURIComponent(config.cityPartner)}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-md bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white hover:opacity-95"
                >
                  🗺️ Rota: {config.cityYou} → {config.cityPartner}
                </a>
              </div>
            </div>

            <Notes currentUser={user} />
            <Letters currentUser={user} />
          </motion.section>
        )}
      </main>

      {/* Mektup Modal */}
      <LoveLetterModal open={letterOpen} onClose={() => setLetterOpen(false)} currentUser={user || {name:"",role:""}} />
    </div>
  );
}
