const ADMIN_NUMBER = "5554981031016";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/notify-whatsapp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
      },
      body: JSON.stringify({ to, message }),
    });
  } catch (err) {
    console.error("WhatsApp send error:", err);
  }
}

export function notifyAdmin(message: string) {
  return sendWhatsApp(ADMIN_NUMBER, message);
}
