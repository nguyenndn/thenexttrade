'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const contactSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export async function submitContactForm(data: ContactFormData) {
    try {
        // Validate input
        const validData = contactSchema.parse(data);

        // Init Supabase client
        const supabase = await createClient();

        // Check if table exists (this is a fast way to fail gracefully if the user hasn't created it yet)
        const { error: insertError } = await supabase
            .from('contact_messages')
            .insert([{
                name: validData.name,
                email: validData.email,
                subject: validData.subject,
                message: validData.message,
                status: 'new'
            }]);

        if (insertError) {
            console.error('Error inserting contact message:', insertError);
            
            // If the error is that the table doesn't exist, we can give a friendly message
            if (insertError.code === '42P01') {
                return { 
                    success: false, 
                    error: "The contact system is currently being set up. Please try again later or email us directly." 
                };
            }

            return { success: false, error: "Failed to send message. Please try again." };
        }

        return { success: true };
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            const zodErr = e as any;
            return { success: false, error: zodErr.errors?.[0]?.message || "Validation failed" };
        }
        return { success: false, error: "An unexpected error occurred." };
    }
}
