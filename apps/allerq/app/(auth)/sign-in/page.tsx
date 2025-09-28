'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignIn = async () => {
    setError("");

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : "Invalid email or password.";
        setError(message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login failed:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24 p-6 rounded-xl shadow-md bg-white space-y-4">
      <h1 className="text-2xl font-bold text-center">Sign In</h1>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button onClick={handleSignIn} className="w-full">
        Sign In
      </Button>
    </div>
  );
}
