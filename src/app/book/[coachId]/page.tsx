'use client'

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatIntakeForm from "@/components/ChatIntakeForm";
import type { Message } from "@/components/ChatIntakeForm";

type Availability = { day_of_week: number; start_time: string; end_time: string; };
type TimeSlot = { time: Date; available: boolean; };

const generateTimeSlots = (availabilities: Availability[], bookings: any[]): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const bookedTimestamps = new Set(bookings.map(b => new Date(b.booking_time).getTime()));
    for (let i = 0; i < 7; i++) {
        const day = new Date(now);
        day.setDate(now.getDate() + i);
        const dayOfWeek = day.getDay();
        const availability = availabilities.find(a => a.day_of_week === dayOfWeek);
        if (availability) {
            const [startHour, startMinute] = availability.start_time.split(':').map(Number);
            const [endHour, endMinute] = availability.end_time.split(':').map(Number);
            let currentSlot = new Date(day);
            currentSlot.setHours(startHour, startMinute, 0, 0);
            const endSlot = new Date(day);
            endSlot.setHours(endHour, endMinute, 0, 0);
            while (currentSlot < endSlot) {
                if (currentSlot > now) {
                    const isBooked = bookedTimestamps.has(currentSlot.getTime());
                    slots.push({ time: new Date(currentSlot), available: !isBooked });
                }
                currentSlot.setHours(currentSlot.getHours() + 1);
            }
        }
    }
    return slots;
};

export default function BookingPage() {
    const params = useParams();
    const coachId = params.coachId as string;
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBooked, setIsBooked] = useState(false);
    const [isIntakeComplete, setIsIntakeComplete] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: availabilities, error: availError } = await supabase.from('availabilities').select('*').eq('coach_id', coachId);
            const { data: bookings, error: bookError } = await supabase.from('bookings').select('booking_time').eq('coach_id', coachId);
            if (availError || bookError) { console.error(availError || bookError); setIsLoading(false); return; }
            const slots = generateTimeSlots(availabilities, bookings);
            setTimeSlots(slots);
            setIsLoading(false);
        };
        fetchData();
    }, [coachId, supabase]);

    const handleIntakeComplete = (data: { details: { name: string; email: string; }; messages: Message[]; }) => {
        setClientName(data.details.name);
        setClientEmail(data.details.email);
        setChatHistory(data.messages); // Save the chat history
        setIsIntakeComplete(true);
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || !clientName || !clientEmail) { alert('Please fill in all fields and select a time slot.'); return; }
        const { error } = await supabase.from('bookings').insert({ coach_id: coachId, client_name: clientName, client_email: clientEmail, booking_time: selectedSlot.toISOString(), chat_history: chatHistory });
        if (error) { alert('Error creating booking: ' + error.message); } 
        else { setIsBooked(true); }
    };

    if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading availability...</div>;

    if(isBooked) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold text-green-600 mb-4">Booking Confirmed!</h1>
                <p>Thank you, {clientName}. You will receive a confirmation email shortly.</p>
            </div>
        </div>
    );

    return (
        <div className="flex justify-center min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-xl">
                <h1 className="text-2xl font-bold mb-6 text-center">Book a Session</h1>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Step 1: Your Details</h2>
                    {!isIntakeComplete ? (
                        <ChatIntakeForm onIntakeComplete={handleIntakeComplete} />
                    ) : (
                        <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                            <p><strong>Name:</strong> {clientName}</p>
                            <p><strong>Email:</strong> {clientEmail}</p>
                        </div>
                    )}
                </div>
                {isIntakeComplete && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Step 2: Select a Time</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                            {timeSlots.map(({ time, available }) => (
                                <button key={time.toISOString()} disabled={!available} onClick={() => setSelectedSlot(time)}
                                    className={`p-2 border rounded-lg text-sm ${selectedSlot?.getTime() === time.getTime() ? 'bg-blue-600 text-white' : available ? 'bg-gray-100 hover:bg-gray-200' : 'bg-red-100 text-gray-400 cursor-not-allowed'}`}>
                                    {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    <br />
                                    {time.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleBooking} disabled={!selectedSlot} className="mt-6 w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300">
                            Confirm Booking
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}