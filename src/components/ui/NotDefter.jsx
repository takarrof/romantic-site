import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

export default function NotDefteri() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "notes"), (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleAdd = async () => {
    if (!note.trim()) return;
    await addDoc(collection(db, "notes"), { text: note });
    setNote("");
  };

  return (
    <div>
      <h3>Mini Not Defteri</h3>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Not yaz..."
      />
      <button onClick={handleAdd}>Ekle</button>

      <ul>
        {notes.map((n) => (
          <li key={n.id}>{n.text}</li>
        ))}
      </ul>
    </div>
  );
}
