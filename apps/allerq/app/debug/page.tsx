'use client';

import { useEffect, useState } from "react";
import { getUserByEmail } from "@/lib/ncb/getUserByEmail";
import bcrypt from "bcryptjs";

export default function DebugPage() {
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      try {
        const user = await getUserByEmail("1992test@allerq.com");
        if (!user) {
          setError("No user found.");
          return;
        }

        const isMatch = await bcrypt.compare("Allerq11!", user.uid);
        setOutput({ email: user.email, uid: user.uid, isMatch });
      } catch (err: any) {
        setError(err.message || "Error");
      }
    }

    run();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Login Debug</h1>
      {error && <p className="text-red-600">{error}</p>}
      <pre className="text-sm whitespace-pre-wrap break-all">{JSON.stringify(output, null, 2)}</pre>
    </div>
  );
}