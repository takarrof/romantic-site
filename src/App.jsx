import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

// Firebase
import { db, auth } from "./lib/firebase"; // sende lib/firebase.js böyleydi
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

// ———————————— Yardımcılar ————————————
const fmt2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const diffInDays = (from, to) =>
  Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

function nextDate(month, day) {
  const now = new Date();
  const y = now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() > day)
    ? now.getFullYear() + 1
    : now.getFullYear();
  return new Date(`${y}-${fmt2(month)}-${fmt2(day)}T00:00:00`);
}

function useCountdown(target) {
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remain = Math.max(0, target.getTime() - tick);
  const d = Math.floor(remain / (1000 * 60 * 60 * 24));
  const h = Math.floor((remain / (1000 * 60 * 60)) % 24);
  const m = Math.floor((remain / (1000 * 60)) % 60);
  const s = Math.floor((remain / 1000) % 60);
  return { d, h, m, s };
}

// ———————————— Sabitler ————————————
const REL_START = new Date("2025-04-12T00:00:00");         // sevgili olduğunuz tarih
const MEET_DATE = nextDate(8, 21);                          // bir sonraki buluşma: 21 Ağustos
const CITY_LINE = "Batman ⇄ Antalya • Uzak Mesafe Aşkı";

const USERS = {
  ensar123: { id: "ensar", name: "Ensar", emoji: "❤️", crown: "", color: "from-pink-500 to-rose-500" },
  zehra123: { id: "zehra", name: "Zehra", emoji: "❤️", crown: "👑", color: "from-fuchsia-500 to-pink-500" },
};

// ———————————— Basit UI parçaları ————————————
const Card = ({ className = "", children }) => (
  <div
    className={
      "rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl " +
      "text-white " +
      className
    }
  >
    {children}
  </div>
);

const SectionTitle = ({ icon, children }) => (
  <div className="flex items-center gap-2 mb-2 text-white/80">
    <span className="text-lg">{icon}</span>
    <h3 className="font-semibold">{children}</h3>
  </div>
);

// ———————————— Ana Bileşen ————————————
export default function App() {
  const [me, setMe] = useState(() => {
    try {
      const raw = localStorage.getItem("love.user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  // firebase anon auth (rules için gerekli)
  useEffect(() => {
    signInAnonymously(auth).catch(() => {});
  }, []);

  // Login
  const onLogin = (e) => {
    e.preventDefault();
    const u = USERS[pwd.trim()];
    if (!u) return alert("Şifre yanlış :(");
    localStorage.setItem("love.user", JSON.stringify(u));
    setMe(u);
    setPwd("");
  };

  const onLogout = () => {
    localStorage.removeItem("love.user");
    setMe(null);
  };

  // Sayaçlar
  const togetherDays = useMemo(() => diffInDays(REL_START, new Date()), []);
  const meetLeft = useCountdown(MEET_DATE);

  // ———— Notlar ————
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setNotes(arr);
    });
    return () => unsub();
  }, []);

  const addNote = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    try {
      setLoading(true);
      await addDoc(collection(db, "notes"), {
        text,
        uid: me?.id ?? "unknown",
        userName: me?.name ?? "Bilinmiyor",
        crown: me?.id === "zehra" ? "👑" : "",
        createdAt: serverTimestamp(),
      });
      setDraft("");
    } finally {
      setLoading(false);
    }
  };

  const removeNote = async (n) => {
    if (!me || me.id !== n.uid) return;
    if (!confirm("Bu not silinsin mi?")) return;
    await deleteDoc(doc(db, "notes", n.id));
  };

  // ———— Müzik Çalar ————
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const el = document.getElementById("player");
    if (!el) return;
    playing ? el.play().catch(() => {}) : el.pause();
  }, [playing]);

  // ———— Giriş Ekranı ————
  if (!me) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1b1420] to-[#0f0d13] text-white">
        <div className="max-w-md mx-auto px-6 pt-28">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-3xl font-bold"
          >
            Ensar <span className="text-pink-400">❤️</span> Zehra
          </motion.h1>
          <p className="text-center mt-2 text-white/65">{CITY_LINE}</p>

          <Card className="mt-8 p-6">
            <h2 className="text-lg font-semibold mb-3">Merhaba 💫</h2>
            <p className="text-sm text-white/70 mb-4">
              Giriş için şifreyi yaz: <b>ensar123</b> veya <b>zehra123</b>
            </p>

            <form onSubmit={onLogin} className="flex flex-col gap-3">
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Şifre…"
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-3 font-semibold shadow-lg shadow-rose-500/25 active:scale-[.98]"
              >
                Giriş Yap
              </button>
            </form>
          </Card>

          <p className="text-center mt-6 text-xs text-white/40">
            Bu site sadece ikimiz için 💞
          </p>
        </div>
      </div>
    );
  }

  // ———— Ana Sayfa ————
  return (
    <div className="min-h-screen bg-[#0d0b10] bg-[radial-gradient(circle_at_20%_10%,rgba(236,72,153,.15),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(244,63,94,.12),transparent_45%)] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Başlık */}
        <div className="text-center">
          <p className="text-sm text-white/60">{CITY_LINE}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-2">
            {me.name} <span className="text-pink-400">❤️</span> Zehra{" "}
            {me.id === "zehra" && <span>👑</span>}
          </h1>

          <p className="mt-3 text-white/75">
            {diffInDays(REL_START, new Date())} gündür birlikteyiz. Bir sonraki
            buluşmaya{" "}
            <b>
              {meetLeft.d}g {fmt2(meetLeft.h)}s {fmt2(meetLeft.m)}d{" "}
              {fmt2(meetLeft.s)}sn
            </b>{" "}
            kaldı.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <audio id="player" src="/song.mp3" preload="none" />
            <button
              onClick={() => setPlaying((p) => !p)}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 transition"
            >
              {playing ? "⏸ Durdur" : "▶️ Ortak Şarkımızı Çal"}
            </button>

            <button
              onClick={onLogout}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 transition"
              title="Çıkış"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Kartlar */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <Card className="p-5">
            <SectionTitle icon="⏱">Birlikte Geçen Gün</SectionTitle>
            <div className="text-2xl font-bold">{togetherDays} gün</div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon="📍">Şehirlerimiz</SectionTitle>
            <div className="text-sm">Batman ⇄ Antalya</div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon="💖">Kalbim</SectionTitle>
            <div className="text-sm">Hep sende {me.id === "zehra" ? "💗" : "💘"}</div>
          </Card>
        </div>

        {/* Not Defteri */}
        <Card className="p-5 mt-6">
          <SectionTitle icon="📝">Mini Not Defteri (canlı)</SectionTitle>

          {/* Mobilde ALT ALTA, >=sm yan yana  */}
          <form
            onSubmit={addNote}
            className="mt-3 flex flex-col sm:flex-row items-stretch gap-3"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Bugün ona ne söylemek istersin?"
              className="w-full rounded-xl bg-white/10 placeholder-white/60 text-white px-4 py-3 text-base focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-rose-400/50"
            />

            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg shadow-rose-500/25 active:scale-[.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Ekle
            </button>
          </form>

          {/* notlar */}
          <div className="mt-4 space-y-3">
            {notes.length === 0 && (
              <div className="text-sm text-white/50">Henüz not yok.</div>
            )}

            {notes.map((n) => (
              <div
                key={n.id}
                className="rounded-xl bg-white/8 border border-white/10 p-4 relative"
              >
                <div className="text-xs text-white/50 mb-1">
                  <b>
                    {n.userName} {n.crown}
                  </b>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{n.text}</div>

                {/* sadece sahibi silebilir */}
                {me?.id === n.uid && (
                  <button
                    onClick={() => removeNote(n)}
                    className="absolute right-2 top-2 text-xs text-white/60 hover:text-rose-300"
                    title="Sil"
                  >
                    Sil
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Özel Günler */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <Card className="p-5">
            <SectionTitle icon="🎂">Ensar’ın Doğum Günü</SectionTitle>
            <div>07 Ağustos</div>
          </Card>
          <Card className="p-5">
            <SectionTitle icon="🎂">Zehra’nın Doğum Günü</SectionTitle>
            <div>23 Eylül</div>
          </Card>
          <Card className="p-5">
            <SectionTitle icon="💍">Yıldönümümüz</SectionTitle>
            <div>12 Nisan</div>
          </Card>
        </div>

        <p className="text-center mt-10 text-xs text-white/40">
          {new Date().getFullYear()} • sadece ikimiz 💞
        </p>
      </div>
    </div>
  );
}
