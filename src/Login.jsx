import { useState } from "react";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (password === "zehra123") {
      onLogin("Zehra 👑");
    } else if (password === "ensar123") {
      onLogin("Ensar");
    } else {
      alert("Şifre yanlış!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-200">
      <h1 className="text-3xl font-bold mb-6">💕 Özel Notlar 💕</h1>
      <input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="p-2 rounded border border-gray-300 mb-4 w-64"
      />
      <button
        onClick={handleLogin}
        className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
      >
        Giriş
      </button>
    </div>
  );
}
