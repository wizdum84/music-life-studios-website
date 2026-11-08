import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

function Shell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="container max-w-lg py-16"><Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card></div>;
}

export function ForgotPassword() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); try { const response = await apiRequest("POST", "/api/password/forgot", { email }); const data = await response.json(); setMessage(data.message); } finally { setBusy(false); } };
  return <Shell title="Reset your password" description="We’ll email a secure reset link if the address belongs to an account."><div className="space-y-4"><div><Label htmlFor="recovery-email">Email</Label><Input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div><Button className="w-full" onClick={submit} disabled={busy || !email}>{busy ? "Sending..." : "Send reset link"}</Button>{message && <p className="text-sm">{message}</p>}<Link href="/account/login" className="block text-center text-sm text-primary hover:underline">Back to login</Link></div></Shell>;
}

export function ResetPassword() {
  const [, navigate] = useLocation(); const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => { if (password !== confirm) return setError("Passwords do not match."); setBusy(true); try { const response = await apiRequest("POST", "/api/password/reset", { token, password }); const data = await response.json(); if (!response.ok) throw new Error(data.error); navigate("/account/login"); } catch (error: any) { setError(error.message); } finally { setBusy(false); } };
  return <Shell title="Choose a new password" description="Your reset link expires after 30 minutes and can be used once."><div className="space-y-4"><div><Label>New password</Label><Input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></div><div><Label>Confirm password</Label><Input type="password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} /></div>{error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full" onClick={submit} disabled={busy || password.length < 8}>{busy ? "Updating..." : "Update password"}</Button></div></Shell>;
}

export function VerifyEmail() {
  const token = new URLSearchParams(window.location.search).get("token") || ""; const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const verify = async () => { setBusy(true); try { const response = await apiRequest("POST", "/api/email/verify", { token }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setMessage(data.message); } catch (error: any) { setError(error.message); } finally { setBusy(false); } };
  return <Shell title="Verify your email" description="Confirm this address for your Music Life Studios account."><div className="space-y-4">{message ? <><p>{message}</p><Link href="/account" className="block text-center text-primary hover:underline">Open account</Link></> : <Button className="w-full" onClick={verify} disabled={busy || !token}>{busy ? "Verifying..." : "Verify email"}</Button>}{error && <p className="text-sm text-destructive">{error}</p>}</div></Shell>;
}
