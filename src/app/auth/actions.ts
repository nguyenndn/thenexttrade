'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { recordSession } from '@/lib/session'

import { authSchema } from '@/lib/validations/auth'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // 1. Validate Input
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const validated = authSchema.safeParse(data)
    if (!validated.success) {
        return { error: 'Invalid inputs' }
    }

    // 2. Auth with Supabase
    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    // 3. Revalidate and Redirect
    // Check/Sync Prisma User to prevent "orphaned session" redirect loops
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) {
            // Check for potential ID mismatch (Seed Data vs Supabase Auth)
            const existingUserByEmail = await prisma.user.findUnique({
                where: { email: user.email! }
            });

            if (existingUserByEmail) {
                // Conflict: Email exists but ID is different.
                // Action: Updates the local user ID to match Supabase Auth ID.
                // This preserves seed data relationships while fixing the auth link.

                await prisma.user.update({
                    where: { email: user.email! },
                    data: { id: user.id }
                });
            } else {
                // Self-heal: Create missing user record
                await prisma.user.create({
                    data: {
                        id: user.id,
                        email: user.email,
                        name: user.user_metadata?.full_name || '',
                        image: user.user_metadata?.avatar_url || '',
                    }
                });
            }
        }
        await recordSession(user.id);

        // Check for 2FA
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        const factors = freshUser?.factors || [];
        const totpFactor = factors.find(f => f.factor_type === 'totp' && f.status === 'verified');

        if (totpFactor) {
            return { requires2FA: true };
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function verifyLogin2FA(code: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const factors = user.factors || []
    const totpFactor = factors.find(f => f.factor_type === 'totp' && f.status === 'verified')

    if (!totpFactor) {
        return { error: "No 2FA factor found" }
    }

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
    if (challengeErr) return { error: challengeErr.message }

    const { error } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code
    })

    if (error) return { error: error.message }

    revalidatePath('/', 'layout')
    redirect('/academy')
}

export async function signInWithMagicLink(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const origin = (await headers()).get('origin')

    if (!email) {
        return { error: 'Email is required' }
    }

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Check your email for a login link!' }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const fullName = formData.get('fullName') as string
    const country = formData.get('country') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Simple validation
    if (!email || !password || password.length < 6 || !fullName) {
        return { error: 'Invalid inputs. Password must be at least 6 chars.' }
    }

    // Attempt to split name for metadata if needed, otherwise just use full name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // 2. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName.trim(),
                country: country,
                first_name: firstName,
                last_name: lastName
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Check if session is automatically established (Email Verification disabled)
    if (data?.user && data.session) {
        // Fallback: If verification is disabled, insert immediately
        await prisma.user.create({
            data: {
                id: data.user.id,
                email: email,
                name: fullName.trim(),
            }
        }).catch(() => {});
        
        revalidatePath('/', 'layout')
        redirect('/onboarding')
    }

    // Email verification is ON -> session is null -> Requires Verification Flow
    // DO NOT insert into Prisma yet. Keep DB clean.
    return { success: true, requiresVerification: true, email: email, message: 'OTP sent to your email.' }
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/login')
}


export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const origin = (await headers()).get('origin')

    if (!email) {
        return { error: 'Email is required' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword) {
        return { error: 'Password and Confirm Password are required' }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    redirect('/academy')
}

// ----------------------------------------------------------------------------
// EMAIL VERIFICATION (OTP) ACTIONS
// ----------------------------------------------------------------------------

export async function verifyOtpAction(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const otp = formData.get('otp') as string

    if (!email || !otp || otp.length !== 8) {
        return { error: 'Email and an 8-digit OTP code are required.' }
    }

    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
    })

    if (error) {
        return { error: error.message }
    }

    // On OTP Success: Insert user into Database (Prisma)
    if (data.user) {
        const metadata = data.user.user_metadata;
        const fullName = metadata?.full_name || (metadata?.first_name ? metadata.first_name + ' ' + metadata.last_name : 'Trader');
        
        try {
            await prisma.user.upsert({
                where: { id: data.user.id },
                update: {}, // Do nothing if exists
                create: {
                    id: data.user.id,
                    email: data.user.email!,
                    name: fullName.trim(),
                }
            })
        } catch (err) {
            // Silently handle insert error
        }
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
}

export async function resendOtpAction(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    if (!email) {
        return { error: 'Email is required.' }
    }

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'A new 8-digit code has been sent to your email.' }
}
