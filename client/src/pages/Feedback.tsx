import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { CheckCircle, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

export default function Feedback() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [booking, setBooking] = useState<{ bookingId: number; name: string; submitted: boolean } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!token) { setError("This feedback link is missing or invalid."); setLoading(false); return; }
    apiRequest("GET", `/api/feedback-request/${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((data) => { setBooking(data); setComplete(Boolean(data.submitted)); })
      .catch(() => setError("This feedback link is invalid or expired."))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    if (!rating) { setError("Choose a rating from 1 to 5."); return; }
    setSubmitting(true);
    setError("");
    try {
      await apiRequest("POST", `/api/feedback-request/${encodeURIComponent(token)}`, { rating, comment });
      setComplete(true);
    } catch (submissionError: any) {
      setError(submissionError.message || "Feedback could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-xl px-3 py-10 sm:px-4 sm:py-16">
      <Helmet><title>Session Feedback | Music Life Studios</title></Helmet>
      <Card>
        <CardHeader>
          <CardTitle>How was your session?</CardTitle>
          <CardDescription>{booking ? `Booking #${booking.bookingId} for ${booking.name}` : "Music Life Studios"}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : error && !booking ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</p>
          ) : complete ? (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="mt-4 text-xl font-semibold">Thank you for your feedback.</h2>
              <p className="mt-2 text-muted-foreground">Your response has been received.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="mb-3 font-medium">Your rating</p>
                <div className="flex justify-center gap-2 sm:justify-start">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} star rating`} className="flex h-12 w-12 items-center justify-center rounded-md border">
                      <Star className={`h-7 w-7 ${value <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="feedback-comment" className="mb-2 block font-medium">Comments (optional)</label>
                <Textarea id="feedback-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tell us what went well or what we can improve" rows={5} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full sm:w-auto" onClick={submit} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
