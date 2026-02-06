import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function GET(request: Request) {
    const supabase = await createClient()

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Clear any server-side cache if needed (optional but good practice)
    revalidatePath('/', 'layout')

    // Redirect to login page
    return redirect('/auth/login')
}
