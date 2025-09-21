'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getUserByEmail } from "@/lib/ncb/getUserByEmail";
import { setUserSession } from "@/lib/session/userSession";
import bcrypt from "bcryptjs";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignIn = async () => {
    setError("");

    try {
      const user = await getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.uid))) {
        return setError("Invalid email or password.");
      }

      setUserSession(user);
      router.push("/dashboard");
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
