'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { recordSession } from '@/lib/session'
import { verifyTurnstile } from '@/lib/turnstile'
import { logSecurityEvent, SECURITY_EVENT_TYPES } from '@/lib/security-logger'

import { authSchema, signupSchema } from '@/lib/validations/auth'
import { headers } from 'next/headers'
import { checkAuthRateLimit } from '@/lib/security/auth-rate-limit'
import { AUTH_ERRORS } from '@/lib/security/auth-errors'
import { normalizeCountryCode } from '@/lib/country-utils'
import { recordQualifiedReferral, resolveReferrerByCode } from '@/lib/referrals'
import { isOnboardingDone } from '@/lib/onboarding/onboarding.server'

async function getClientIP(): Promise<string> {
 const h = await headers()
 return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
}

export async function login(formData: FormData) {
 const supabase = await createClient()
 const ip = await getClientIP()
 const email = formData.get('email') as string
 let redirectTo = '/dashboard'

 // Apply Rate Limit
 if (await checkAuthRateLimit('login', ip, email)) {
 return { error: AUTH_ERRORS.RATE_LIMIT_GENERIC }
 }

 // 0. Verify Turnstile
 const turnstileToken = formData.get('cf-turnstile-response') as string
 const turnstileResult = await verifyTurnstile(turnstileToken, ip)
 if (!turnstileResult.success) {
 logSecurityEvent({ type: SECURITY_EVENT_TYPES.TURNSTILE_FAILED, ip, path: '/auth/login', detail: `Email: ${email}` }).catch(() => {})
 return { error: turnstileResult.error || 'Verification failed' }
 }

 // 1. Validate Input
 const data = {
 email,
 password: formData.get('password') as string,
 }

 const validated = authSchema.safeParse(data)
 if (!validated.success) {
 return { error: 'Invalid inputs' }
 }

 // 2. Auth with Supabase
 const { error } = await supabase.auth.signInWithPassword(data)

 if (error) {
 logSecurityEvent({ type: SECURITY_EVENT_TYPES.LOGIN_FAILED, ip, path: '/auth/login', detail: `Email: ${data.email}. Error: ${error.message}` }).catch(() => {})
 return { error: AUTH_ERRORS.LOGIN_GENERIC }
 }

 // 3. Revalidate and Redirect
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
 if (!dbUser) {
 const existingUserByEmail = await prisma.user.findUnique({
 where: { email: user.email! }
 });

 if (existingUserByEmail) {
 // Identity Takeover Protection: Do not mutate User.id automatically.
 logSecurityEvent({ type: SECURITY_EVENT_TYPES.AUTH_FAILED, ip, path: '/auth/login', detail: `Identity conflict for email: ${user.email}` }).catch(() => {})
 return { error: 'Account setup issue. Please contact support.' }
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
 const onboardingDone = await isOnboardingDone(user.id);
 if (!onboardingDone) {
 redirectTo = '/onboarding';
 }

 // Check for 2FA
 const { data: { user: freshUser } } = await supabase.auth.getUser();
 const factors = freshUser?.factors || [];
 const totpFactor = factors.find(f => f.factor_type === 'totp' && f.status === 'verified');

 if (totpFactor) {
 return { requires2FA: true };
 }
 }

 revalidatePath('/', 'layout')
 
 // Get user display name to return to client
 const { data: { user: authedUser } } = await supabase.auth.getUser();
 let displayName = "Trader";
 if (authedUser) {
 const dbUser = await prisma.user.findUnique({ where: { id: authedUser.id } });
 displayName = dbUser?.name || authedUser.user_metadata?.full_name || "Trader";
 }
 
 return { success: true, name: displayName, redirectTo };
}

export async function verifyLogin2FA(code: string) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 const ip = await getClientIP()

 if (!user) return { error: "Unauthorized" }

 if (await checkAuthRateLimit('verify_2fa', ip, user.email)) {
 return { error: AUTH_ERRORS.RATE_LIMIT_GENERIC }
 }

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

 if (error) return { error: AUTH_ERRORS.OTP_VERIFY_GENERIC }

 revalidatePath('/', 'layout')
 redirect('/academy')
}

export async function signInWithMagicLink(formData: FormData) {
 const supabase = await createClient()
 const email = formData.get('email') as string
 const origin = (await headers()).get('origin')
 const ip = await getClientIP()

 if (await checkAuthRateLimit('magic_link', ip, email)) {
 return { success: true, message: AUTH_ERRORS.RATE_LIMIT_GENERIC }
 }

 // Verify Turnstile
 const turnstileToken = formData.get('cf-turnstile-response') as string
 const turnstileResult = await verifyTurnstile(turnstileToken, ip)
 if (!turnstileResult.success) {
 return { error: turnstileResult.error || 'Verification failed' }
 }

 if (!email) {
 return { error: 'Email is required' }
 }

 await supabase.auth.signInWithOtp({
 email,
 options: {
 emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
 },
 })

 // Return generic success to prevent email enumeration
 return { success: true, message: AUTH_ERRORS.MAGIC_LINK_GENERIC }
}

export async function signup(formData: FormData) {
 const supabase = await createClient()
 const ip = await getClientIP()
 const email = formData.get('email') as string

 if (await checkAuthRateLimit('signup', ip, email)) {
 return { error: AUTH_ERRORS.RATE_LIMIT_GENERIC }
 }

 // Verify Turnstile
 const turnstileToken = formData.get('cf-turnstile-response') as string
 const turnstileResult = await verifyTurnstile(turnstileToken, ip)
 if (!turnstileResult.success) {
 return { error: turnstileResult.error || 'Verification failed' }
 }

 const dataObj = {
 email,
 password: formData.get('password') as string,
 confirm: formData.get('confirm') as string,
 fullName: formData.get('fullName') as string,
 country: formData.get('country') as string,
 termsAccepted: formData.get('termsAccepted') as string,
 }

 const validated = signupSchema.safeParse(dataObj)
 if (!validated.success) {
 return { error: validated.error.issues[0]?.message || 'Invalid inputs' }
 }

 const { fullName, country, password } = validated.data;
 const normalizedCountry = normalizeCountryCode(country);
 const referralCode = (formData.get('referralCode') as string | null)?.trim() || null;
 const referrer = await resolveReferrerByCode(referralCode, validated.data.email);

 // Attempt to split name for metadata if needed, otherwise just use full name
 const nameParts = fullName.trim().split(' ');
 const firstName = nameParts[0] || '';
 const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

 // 2. Sign Up
 const { data, error } = await supabase.auth.signUp({
 email: validated.data.email, // use normalized email
 password,
 options: {
 data: {
 full_name: fullName.trim(),
 country: normalizedCountry,
 first_name: firstName,
 last_name: lastName,
 referral_code: referralCode,
 referrer_user_id: referrer?.id || null,
 },
 },
 })

 if (error) {
 logSecurityEvent({ type: SECURITY_EVENT_TYPES.AUTH_FAILED, ip, path: '/auth/signup', detail: `Email: ${email}. Error: ${error.message}` }).catch(() => {})
 return { error: AUTH_ERRORS.SIGNUP_GENERIC }
 }

 // Check if session is automatically established (Email Verification disabled)
 if (data?.user && data.session) {
 // Fallback: If verification is disabled, insert immediately
 try {
 await prisma.$transaction([
 prisma.user.upsert({
 where: { id: data.user.id },
 update: {
 email: validated.data.email,
 name: fullName.trim(),
 },
 create: {
 id: data.user.id,
 email: validated.data.email,
 name: fullName.trim(),
 },
 }),
 prisma.profile.upsert({
 where: { userId: data.user.id },
 update: normalizedCountry ? { country: normalizedCountry } : {},
 create: {
 userId: data.user.id,
 country: normalizedCountry,
 },
 }),
 ]);

 if (referrer && referrer.id !== data.user.id) {
 await recordQualifiedReferral({
 referrerId: referrer.id,
 referredUserId: data.user.id,
 referredEmail: validated.data.email,
 referredName: fullName.trim(),
 referralCode,
 }).catch(() => {});
 }
 } catch {
 // Silently handle insert error
 }
 
 revalidatePath('/', 'layout')
 redirect('/onboarding')
 }

 // Email verification is ON -> session is null -> Requires Verification Flow
 // DO NOT insert into Prisma yet. Keep DB clean.
 return { success: true, requiresVerification: true, email: validated.data.email, message: 'OTP sent to your email.' }
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
 const ip = await getClientIP()

 if (await checkAuthRateLimit('forgot_password', ip, email)) {
 return { error: AUTH_ERRORS.RATE_LIMIT_GENERIC }
 }

 const turnstileToken = formData.get('cf-turnstile-response') as string
 const turnstileResult = await verifyTurnstile(turnstileToken, ip)
 if (!turnstileResult.success) {
 return { error: turnstileResult.error || 'Verification failed' }
 }

 if (!email) {
 return { error: 'Email is required' }
 }

 await supabase.auth.resetPasswordForEmail(email, {
 redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
 })

 // Return generic success regardless of error to prevent email enumeration
 return { success: true, message: AUTH_ERRORS.FORGOT_PASSWORD_GENERIC }
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
 const ip = await getClientIP()

 if (await checkAuthRateLimit('verify_otp', ip, email)) {
 return { error: AUTH_ERRORS.RATE_LIMIT_GENERIC }
 }

 if (!email || !otp || otp.length !== 8) {
 return { error: 'Email and an 8-digit OTP code are required.' }
 }

 const { data, error } = await supabase.auth.verifyOtp({
 email,
 token: otp,
 type: 'signup'
 })

 if (error) {
 return { error: AUTH_ERRORS.OTP_VERIFY_GENERIC }
 }

 // On OTP Success: Insert user into Database (Prisma)
 if (data.user) {
 const metadata = data.user.user_metadata;
 const fullName = metadata?.full_name || (metadata?.first_name ? metadata.first_name + ' ' + metadata.last_name : 'Trader');
 const referrerUserId = typeof metadata?.referrer_user_id === 'string' ? metadata.referrer_user_id : null;
 const referralCode = typeof metadata?.referral_code === 'string' ? metadata.referral_code : null;
 const normalizedCountry = normalizeCountryCode(
 typeof metadata?.country === 'string' ? metadata.country : null
 );
 
 try {
 await prisma.$transaction([
 prisma.user.upsert({
 where: { id: data.user.id },
 update: {
 email: data.user.email!,
 name: fullName.trim(),
 },
 create: {
 id: data.user.id,
 email: data.user.email!,
 name: fullName.trim(),
 },
 }),
 prisma.profile.upsert({
 where: { userId: data.user.id },
 update: normalizedCountry ? { country: normalizedCountry } : {},
 create: {
 userId: data.user.id,
 country: normalizedCountry,
 },
 }),
 ])

 if (referrerUserId && referrerUserId !== data.user.id) {
 await recordQualifiedReferral({
 referrerId: referrerUserId,
 referredUserId: data.user.id,
 referredEmail: data.user.email,
 referredName: fullName.trim(),
 referralCode,
 }).catch(() => {});
 }
 } catch {
 // Silently handle insert error
 }
 }

 revalidatePath('/', 'layout')
 redirect('/onboarding')
}

export async function resendOtpAction(formData: FormData) {
 const supabase = await createClient()
 const email = formData.get('email') as string
 const ip = await getClientIP()

 if (await checkAuthRateLimit('resend_otp', ip, email)) {
 return { error: AUTH_ERRORS.RATE_LIMIT_GENERIC }
 }

 if (!email) {
 return { error: 'Email is required.' }
 }

 const { error } = await supabase.auth.resend({
 type: 'signup',
 email,
 })

 if (error) {
 logSecurityEvent({ type: SECURITY_EVENT_TYPES.AUTH_FAILED, ip, path: '/auth/actions/resend', detail: `Resend failed: ${error.message}` }).catch(() => {})
 return { error: AUTH_ERRORS.OTP_RESEND_GENERIC }
 }

 return { success: true, message: 'A new 8-digit code has been sent to your email.' }
}
