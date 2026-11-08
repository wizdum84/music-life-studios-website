import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type Setup = { qrCode: string; manualKey: string; setupToken: string };

export default function AdminSecurity() {
  const { user } = useAuth(); const { toast } = useToast(); const [setup, setSetup] = useState<Setup | null>(null); const [code, setCode] = useState(""); const [busy, setBusy] = useState(false);
  const begin = async () => { setBusy(true); try { const response = await apiRequest("POST", "/api/admin/mfa/setup"); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSetup(data); } catch (error: any) { toast({ title: "Setup failed", description: error.message, variant: "destructive" }); } finally { setBusy(false); } };
  const enable = async () => { if (!setup) return; setBusy(true); try { const response = await apiRequest("POST", "/api/admin/mfa/enable", { setupToken: setup.setupToken, code }); const data = await response.json(); if (!response.ok) throw new Error(data.error); queryClient.setQueryData(["/api/user"], data.user); setSetup(null); toast({ title: "Admin MFA enabled", description: "Future admin logins require your authenticator code." }); } catch (error: any) { toast({ title: "Code not accepted", description: error.message, variant: "destructive" }); } finally { setBusy(false); } };
  return <Card><CardHeader><CardTitle>Administrator Security</CardTitle><CardDescription>Protect the admin dashboard with a six-digit authenticator code.</CardDescription></CardHeader><CardContent className="space-y-5">{user?.mfaEnabled ? <div className="rounded-md border border-green-300 bg-green-50 p-4 text-green-900"><strong>MFA is enabled.</strong> Your password and authenticator code are required at every new login.</div> : setup ? <div className="max-w-md space-y-4"><p className="text-sm">Scan this QR code with Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app.</p><img src={setup.qrCode} alt="Authenticator setup QR code" className="h-52 w-52 border bg-white p-2" /><div><Label>Manual setup key</Label><Input readOnly value={setup.manualKey} /></div><div><Label htmlFor="mfa-code">Enter the six-digit code</Label><Input id="mfa-code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} /></div><Button onClick={enable} disabled={busy || code.length !== 6}>{busy ? "Verifying..." : "Verify and enable MFA"}</Button></div> : <Button onClick={begin} disabled={busy}>{busy ? "Preparing..." : "Set up authenticator MFA"}</Button>}</CardContent></Card>;
}
