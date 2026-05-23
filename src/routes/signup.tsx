import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getNextId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Baby, Users } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Account — Kiddobee" }] }),
  component: SignupPage,
});

type Role = "parent" | "babysitter";

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError("");
    setLoading(true);

    try {
      const profileId = await getNextId(
        role === "parent" ? "Parent" : "Babysitter",
        role === "parent" ? "Parent ID" : "Sitter ID",
        role === "parent" ? "P" : "S",
      );

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, profileId, firstName, lastName } },
      });
      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("Signup failed");

      if (role === "parent") {
        await supabase.from("Parent").insert({
          "Parent ID": profileId,
          "First Name": firstName,
          "Last Name": lastName,
          "Email": email,
          "Date Joined": new Date().toISOString().split("T")[0],
          "Profile Status": "Submitted",
        });
        navigate({ to: "/parent/profile-setup" });
      } else {
        await supabase.from("Babysitter").insert({
          "Sitter ID": profileId,
          "First Name": firstName,
          "Last Name": lastName,
          "Date Joined": new Date().toISOString().split("T")[0],
          "Profile Status": "Submitted",
        });
        navigate({ to: "/babysitter/profile-setup" });
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00B4D8]/10 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.avif" alt="Kiddobee" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kiddobee</h1>
            <p className="text-sm text-gray-500">Paris babysitting platform</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-[#00B4D8]" : "bg-gray-100"}`} />
            ))}
          </div>

          {step === 1 ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">I am a…</h2>
              <p className="text-sm text-gray-500 mb-6">Choose your role to get started</p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { r: "parent" as Role, label: "Parent", sub: "Looking for a babysitter", Icon: Users },
                  { r: "babysitter" as Role, label: "Babysitter", sub: "Looking for families", Icon: Baby },
                ] as const).map(({ r, label, sub, Icon }) => (
                  <button key={r} type="button" onClick={() => { setRole(r); setStep(2); }}
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:border-[#00B4D8] hover:bg-[#00B4D8]/5 ${role === r ? "border-[#00B4D8] bg-[#00B4D8]/5" : "border-gray-200"}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${role === r ? "bg-[#00B4D8] text-white" : "bg-gray-100 text-gray-500"}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Marie" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Dupont" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 8 characters" minLength={8} />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button type="submit" disabled={loading} className="flex-1 bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</> : "Create account"}
                  </Button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#00B4D8] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
