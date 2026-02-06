'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { recordSession } from '@/lib/session'

import { authSchema } from '@/lib/validations/auth'

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
    redirect('/academy')
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

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const country = formData.get('country') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Simple validation
    if (!email || !password || password.length < 6) {
        return { error: 'Invalid inputs. Password must be at least 6 chars.' }
    }

    // 2. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: `${firstName} ${lastName}`.trim(),
                country: country,
                first_name: firstName,
                last_name: lastName
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Sync to Prisma immediately
    if (data.user) {
        await prisma.user.create({
            data: {
                id: data.user.id,
                email: email,
                name: `${firstName} ${lastName}`.trim(),
            }
        }).catch(err => {
            // Ignore duplicate error if it somehow exists
            console.error("Prisma Create Error (Ignored):", err);
        });
    }

    // Check if session is established
    if (data?.user && !data.session) {
        return { success: true, message: 'Please check your email to confirm your account.' }
    }

    // 3. Redirect
    revalidatePath('/', 'layout')
    redirect('/onboarding')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/login')
}

import { headers } from 'next/headers'

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
