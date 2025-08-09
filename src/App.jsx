import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "./lib/firebase";

// =============  K O N F I G  =============
const config = {
  cities: "Batman ⇄ Antalya • Uzak Mesafe Aşkı",
  anniversary: "2025-04-12", // 12.04.2025
  nextMeet: "2025-08-21",    // 21 Ağustos 2025
  songUrl:
    "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Komiku/Its_time_for_adventure/Komiku_-_07_-_Battle_of_Pogs.mp3",
  ensarName: "Ensar",
  zehraName: "Zehra",
};

// Şifre → isim eşleşmeleri
const CREDENTIALS = {
  ensar123: "Ensar",
  zehra123: "Zehra",
};

// Zaman formatı
function diffToParts(targetISO) {
  const target = new Date(targetISO).getTime();
  const now = Date.now();
  let diff = Math.max(0, target - now); // negatifse 0’a sabitle

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= d * (1000 * 60 * 60 * 24);

  const h = Math.floor(diff / (1000 * 60 * 60));
  diff -= h * (1000 * 60 * 60);

  const m = Math.floor(diff / (1000 * 60));
  diff -= m * (1000 * 60);

  const s = Math.floor(diff / 1000);
  return { d, h, m, s };
}

function formatCounter({ d, h, m, s }) {
  return `${d}g ${h}s ${m}d ${s}sn`;
}

export default function App() {
  const [who, setWho] = useState(null); // "Ensar" | "Zehra"
  const [pass, setPass] = useState("");
  const [togetherDays, setTogetherDays] = useState(0);
  const [meetCounter, setMeetCounter] = useState(
    formatCounter(diffToParts(config.nextMeet))
  );

  // Notlar
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  // Aşk Mektubu
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterText, setLetterText] = useState("");

  // Audio player
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ cur: 0, dur: 0 });

  // Firebase anon login (deploy için şart)
  useEffect(() => {
    signInAnonymously(auth).catch(() => {});
  }, []);

  // Birlikte geçen gün
  useEffect(() => {
    const ann = new Date(config.anniversary);
    const now = new Date();
    const diff = Math.floor((now - ann) / (1000 * 60 * 60 * 24));
    setTogetherDays(diff < 0 ? 0 : diff);
  }, []);

  // Buluşma geri sayım
  useEffect(() => {
    const id = setInterval(() => {
      setMeetCounter(formatCounter(diffToParts(config.nextMeet)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Notları canlı dinle
  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setNotes(arr);
    });
    return () => unsub();
  }, []);

  // Not ekle
  async function addNote(e) {
    e?.preventDefault?.();
    const text = note.trim();
    if (!text || !who) return;
    await addDoc(collection(db, "notes"), {
      text,
      createdAt: serverTimestamp(),
      author: who,
    });
    setNote("");
  }

  // Not sil (yazan kişi silsin!)
  async function deleteNote(id, author) {
    if (who !== author) return;
    await deleteDoc(doc(db, "notes", id));
  }

  // Mektup kaydet
  async function saveLetter() {
    const t = letterText.trim();
    if (!t || !who) return;
    await addDoc(collection(db, "letters"), {
      text: t,
      author: who,
      createdAt: serverTimestamp(),
    });
    setLetterText("");
    setLetterOpen(false);
  }

  // Audio
  function togglePlay() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }
  function onTime() {
    if (!audioRef.current) return;
    setProgress({
      cur: audioRef.current.currentTime,
      dur: audioRef.current.duration || 0,
    });
  }
  function seek(e) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Number(e.target.value);
  }

  // Şifreli giriş
  function handleLogin(e) {
    e.preventDefault();
    const name = CREDENTIALS[pass];
    if (name) {
      setWho(name);
      setPass("");
    } else {
      setPass("");
    }
  }

  // Başlık “Zehra 👸” olsun (kalıcı)
  const headerRight = useMemo(() => {
    // sabit istek: her zaman Zehra’nın yanında prenses emojisi
    return `${config.zehraName} 👸`;
  }, []);

  // Mobil uyumlu form sınıfları (buton kayma sorunu çözülür)
  const formCls =
    "grid grid-cols-[1fr_auto] gap-2 sm:flex sm:items-center sm:gap-3";

  if (!who) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1b1b20] to-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-[#101014]/70 shadow-xl ring-1 ring-white/10 p-6">
          <div className="text-center space-y-1">
            <div className="text-sm opacity-70">{config.cities}</div>
            <h1 className="text-2xl font-bold">
              {config.ensarName} <span className="text-pink-400">❤</span>{" "}
              {config.zehraName} 👸
            </h1>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <label className="block text-sm opacity-70">Şifre</label>
            <input
              className="w-full rounded-xl px-3 py-3 bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoFocus
              placeholder="••••••"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 transition px-4 py-3 font-medium"
            >
              Giriş Yap
            </button>
            <div className="text-xs opacity-60 text-center">
              (İpucu yok. 😇)
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#0b0b0e] relative overflow-x-hidden">
      {/* Kalpler */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(transparent,transparent,rgba(255,0,128,0.06))]"></div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Başlık */}
        <div className="text-center space-y-2">
          <div className="text-sm opacity-70">{config.cities}</div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {config.ensarName} <span className="text-pink-400">❤</span>{" "}
            {headerRight}
          </h1>

          <div className="text-sm mt-2 opacity-80">
            {togetherDays} gündür birlikteyiz. Bir sonraki buluşmaya{" "}
            <span className="font-semibold text-pink-400">{meetCounter}</span>{" "}
            kaldı.
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            {/* Müzik çalar */}
            <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="rounded-lg bg-pink-500 hover:bg-pink-600 px-3 py-2 text-sm"
              >
                {isPlaying ? "Durdur" : "Çal"}
              </button>
              <input
                type="range"
                min={0}
                max={progress.dur || 0}
                value={progress.cur}
                onChange={seek}
                className="w-40"
              />
              <audio
                ref={audioRef}
                src={config.songUrl}
                onTimeUpdate={onTime}
                onLoadedMetadata={onTime}
                onEnded={() => setIsPlaying(false)}
              />
            </div>

            {/* Aşk mektubu */}
            <button
              onClick={() => setLetterOpen(true)}
              className="rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-2 hover:bg-white/10"
            >
              💌 Aşk Mektubu
            </button>
          </div>
        </div>

        {/* Bilgi kutuları */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-sm opacity-70">Birlikte Geçen Gün</div>
            <div className="text-2xl font-semibold mt-2">{togetherDays} gün</div>
          </div>

          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-sm opacity-70">Şehirlerimiz</div>
            <div className="text-lg mt-2">Batman ⇄ Antalya</div>
          </div>

          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-sm opacity-70">Kalbim</div>
            <div className="text-lg mt-2">
              Hep sende{" "}
              <span role="img" aria-label="kalp">
                💖
              </span>
            </div>
          </div>
        </div>

        {/* Canlı Not Defteri */}
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 mt-8">
          <div className="font-semibold mb-3">Mini Not Defteri (canlı)</div>

          <form onSubmit={addNote} className={formCls}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bugün ona ne söylemek istersin?"
              className="rounded-xl px-3 py-3 bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500 w-full"
            />
            <button
              type="submit"
              className="rounded-xl bg-pink-500 hover:bg-pink-600 transition px-4 py-3 font-medium"
            >
              Ekle
            </button>
          </form>

          {/* Notlar listesi */}
          <div className="mt-4 space-y-3">
            {notes.length === 0 && (
              <div className="text-sm opacity-60">Henüz not yok.</div>
            )}
            {notes.map((n) => (
              <div
                key={n.id}
                className="rounded-xl bg-white/5 border border-white/10 p-3"
              >
                <div className="text-[13px] opacity-70 flex items-center justify-between">
                  <span>
                    {n.author === "Zehra" ? "Zehra 👸" : n.author || "Bilinmiyor"}
                  </span>
                  {who === n.author && (
                    <button
                      onClick={() => deleteNote(n.id, n.author)}
                      className="text-xs text-pink-300 hover:text-pink-400"
                    >
                      Sil
                    </button>
                  )}
                </div>
                <div className="mt-1">{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aşk Mektubu Modal */}
      {letterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-[#101014] ring-1 ring-white/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-lg">💌 Aşk Mektubu</div>
              <button
                onClick={() => setLetterOpen(false)}
                className="opacity-70 hover:opacity-100"
              >
                Kapat
              </button>
            </div>

            <textarea
              value={letterText}
              onChange={(e) => setLetterText(e.target.value)}
              rows={8}
              placeholder="Bugünlük mektubun..."
              className="w-full rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500 p-3"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setLetterOpen(false)}
                className="rounded-xl px-4 py-2 bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
              >
                Vazgeç
              </button>
              <button
                onClick={saveLetter}
                className="rounded-xl px-4 py-2 bg-pink-500 hover:bg-pink-600"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
