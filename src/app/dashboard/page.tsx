'use client'

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { type Message } from "@/components/ChatIntakeForm" // Import the Message type

type Availability = { day_of_week: number; start_time: string; end_time: string; enabled: boolean; };
type Booking = { id: number; client_name: string; client_email: string; booking_time: string; chat_history: Message[]; }; // Corrected type

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summaries, setSummaries] = useState<{ [key: number]: string }>({});
  const [isLoadingSummary, setIsLoadingSummary] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const [supabase] = useState(createClient);

  useEffect(() => {
    const checkSessionAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); } 
      else {
        setUser(session.user);
        const { data: availData, error: availError } = await supabase.from('availabilities').select('*').eq('coach_id', session.user.id);
        const { data: bookingData, error: bookingError } = await supabase.from('bookings').select('*').eq('coach_id', session.user.id).order('booking_time', { ascending: true });
        if (availError || bookingError) { console.error(availError || bookingError); } 
        else {
          const initialAvailabilities = days.map((_, index) => {
            const existing = availData.find(d => d.day_of_week === index);
            // New coaches start with Mon–Fri on; otherwise a day is "on" if it has a saved row.
            const enabled = availData.length === 0 ? index >= 1 && index <= 5 : !!existing;
            return { day_of_week: index, start_time: existing?.start_time?.slice(0, 5) || '09:00', end_time: existing?.end_time?.slice(0, 5) || '17:00', enabled };
          });
          setAvailabilities(initialAvailabilities);
          setBookings(bookingData || []);
        }
      }
    };
    checkSessionAndFetchData();
  }, [router, supabase]);

  const handleGenerateSummary = async (bookingId: number, chatHistory: Message[]) => { // Corrected type
    setIsLoadingSummary(bookingId);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory }),
      });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const { summary } = await response.json();
      setSummaries(prev => ({ ...prev, [bookingId]: summary }));
    } catch (err) {
      console.error(err);
      alert('Could not generate the summary. Please try again.');
    } finally {
      setIsLoadingSummary(null);
    }
  };

  const handleAvailabilityChange = (dayIndex: number, field: 'start_time' | 'end_time' | 'enabled', value: string | boolean) => {
    const updatedAvailabilities = [...availabilities];
    updatedAvailabilities[dayIndex] = { ...updatedAvailabilities[dayIndex], [field]: value };
    setAvailabilities(updatedAvailabilities);
  };

  const handleSaveAvailability = async () => {
    if (!user) return;
    const on = availabilities.filter(a => a.enabled);
    const off = availabilities.filter(a => !a.enabled).map(a => a.day_of_week);
    if (on.some(a => a.start_time >= a.end_time)) { alert('Each working day needs an end time after its start time.'); return; }
    setIsSaving(true);
    const { error: upsertError } = on.length
      ? await supabase.from('availabilities').upsert(
          on.map(avail => ({ coach_id: user.id, day_of_week: avail.day_of_week, start_time: avail.start_time, end_time: avail.end_time })),
          { onConflict: 'coach_id, day_of_week' }
        )
      : { error: null };
    const { error: deleteError } = off.length
      ? await supabase.from('availabilities').delete().eq('coach_id', user.id).in('day_of_week', off)
      : { error: null };
    setIsSaving(false);
    const error = upsertError || deleteError;
    if (error) alert('Error saving availability: ' + error.message);
    else alert('Availability saved successfully!');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const bookingUrl = typeof window !== 'undefined' && user ? `${window.location.origin}/book/${user.id}` : '';
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { alert('Copy failed. Select the link and copy it manually.'); }
  };

  if (!user) { return <div className="flex items-center justify-center min-h-screen">Loading...</div>; }

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Coach Dashboard</h1>
          <button onClick={handleLogout} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Log Out</button>
        </div>
        <p className="mb-6">Welcome, <strong>{user.email}</strong></p>
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold mb-1">Your booking link</h2>
          <p className="text-sm text-gray-600 mb-3">Share this with clients (Instagram bio, WhatsApp, email…). They chat with your intake assistant, then pick a slot.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input readOnly value={bookingUrl} onFocus={(e) => e.target.select()} className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm font-mono" />
            <button onClick={handleCopyLink} className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">{copied ? 'Copied!' : 'Copy link'}</button>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Upcoming Bookings</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
            {bookings.length > 0 ? (
              bookings.map(booking => (
                <div key={booking.id} className="p-4 bg-gray-50 rounded-md shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{booking.client_name}</p>
                      <p className="text-sm text-gray-600">{booking.client_email}</p>
                      <p className="text-md text-gray-800 mt-2 font-medium">
                        {new Date(booking.booking_time).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                      </p>
                    </div>
                    {booking.chat_history && (
                      <button
                        onClick={() => handleGenerateSummary(booking.id, booking.chat_history)}
                        disabled={!!isLoadingSummary}
                        className="py-1 px-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                      >
                        {isLoadingSummary === booking.id ? 'Generating...' : (summaries[booking.id] ? 'Regenerate' : 'Get AI Summary')}
                      </button>
                    )}
                  </div>
                  {summaries[booking.id] && (
                    <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <h4 className="font-semibold text-sm mb-1">AI Summary:</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{summaries[booking.id]}</p>
                    </div>
                  )}
                </div>
              ))
            ) : ( <p className="text-gray-500">You have no upcoming bookings.</p> )}
          </div>
        </div>
        <div className="border-t pt-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Set Your Weekly Availability</h2>
          <div className="space-y-4">
            {days.map((day, index) => (
              <div key={day} className={`grid grid-cols-1 sm:grid-cols-3 items-center gap-4 p-3 rounded-lg ${availabilities[index]?.enabled ? 'bg-gray-50' : 'bg-gray-100 text-gray-400'}`}>
                <label className="font-medium flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!availabilities[index]?.enabled} onChange={(e) => handleAvailabilityChange(index, 'enabled', e.target.checked)} className="h-4 w-4" />
                  {day}
                </label>
                {availabilities[index]?.enabled ? (
                  <div className="col-span-1 sm:col-span-2 flex items-center gap-4">
                    <input type="time" value={availabilities[index]?.start_time} onChange={(e) => handleAvailabilityChange(index, 'start_time', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <span>to</span>
                    <input type="time" value={availabilities[index]?.end_time} onChange={(e) => handleAvailabilityChange(index, 'end_time', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                ) : (
                  <p className="col-span-1 sm:col-span-2 text-sm">Day off</p>
                )}
              </div>
            ))}
          </div>
          <button onClick={handleSaveAvailability} disabled={isSaving} className="mt-6 w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{isSaving ? 'Saving…' : 'Save Availability'}</button>
        </div>
      </div>
    </div>
  );
}