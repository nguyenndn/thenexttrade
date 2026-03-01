'use client';

import { useState } from 'react';
import { Send, MapPin, Mail, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submitContactForm } from '@/app/actions/contact';
import { z } from 'zod';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setStatus('idle');
        setErrors({});

        const schema = z.object({
            name: z.string().min(2, "Name must be at least 2 characters"),
            email: z.string().email("Invalid email address"),
            subject: z.string().min(5, "Subject must be at least 5 characters"),
            message: z.string().min(10, "Message must be at least 10 characters"),
        });

        const validationResult = schema.safeParse({ name, email, subject, message });
        
        if (!validationResult.success) {
            const fieldErrors: Record<string, string> = {};
            validationResult.error.issues.forEach((err: z.ZodIssue) => {
                if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
            });
            setErrors(fieldErrors);
            setIsPending(false);
            return;
        }

        const result = await submitContactForm(validationResult.data);
        
        setIsPending(false);

        if (result.success) {
            setStatus('success');
            setName('');
            setEmail('');
            setSubject('');
            setMessage('');
        } else {
            setStatus('error');
            setErrorMessage(result.error || "An unexpected error occurred.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-900 dark:text-white relative overflow-hidden">
            
            {/* Background Glows (Premium Aesthetic) */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

            <PublicHeader />
            
            <main className="py-24 relative z-10 px-4">
                
                {/* Hero Header */}
                <div className="max-w-3xl mx-auto text-center space-y-6 mb-20 mt-12">
                    <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary mb-2 ring-4 ring-primary/5 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                        <MessageSquare size={40} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
                        Let's Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00A06D]">Touch</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        Have a question about our ecosystem, pricing, or need technical support? Drop us a message below.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-8 md:p-12 shadow-xl relative overflow-hidden">
                        
                        <div className="relative z-10 mb-10">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Send us a message</h2>
                            <p className="text-gray-500 dark:text-gray-400">Fill out the form below and we'll get back to you shortly.</p>
                        </div>
                        
                        {/* Status Alerts */}
                        {status === 'success' && (
                            <div className="mb-8 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-5 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="text-green-800 dark:text-green-400 font-bold mb-1 text-lg">Message Sent Successfully</h4>
                                    <p className="text-green-600 dark:text-green-500/80 font-medium leading-relaxed">Thank you for reaching out. Our team will review your message and get back to you to the provided email.</p>
                                </div>
                            </div>
                        )}
                        
                        {status === 'error' && (
                            <div className="mb-8 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-5 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="text-red-800 dark:text-red-400 font-bold mb-1 text-lg">Failed to Send Message</h4>
                                    <p className="text-red-600 dark:text-red-500/80 font-medium leading-relaxed">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Full Name</label>
                                    <Input 
                                        id="name"
                                        placeholder="e.g. John Doe" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        error={errors.name}
                                        disabled={isPending}
                                        className="py-3 px-5 text-base rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                                    <Input 
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        error={errors.email}
                                        disabled={isPending}
                                        className="py-3 px-5 text-base rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Subject</label>
                                <Input 
                                    id="subject"
                                    placeholder="How can we help?" 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    error={errors.subject}
                                    disabled={isPending}
                                    className="py-3 px-5 text-base rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Message</label>
                                <textarea
                                    id="message"
                                    rows={6}
                                    className={`w-full p-5 rounded-xl bg-gray-50 dark:bg-[#151925] border ${errors.message ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20" : "border-gray-200 dark:border-white/10"} text-base outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal text-gray-900 dark:text-white font-medium resize-none`}
                                    placeholder="Please describe your inquiry in detail..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={isPending}
                                ></textarea>
                                {errors.message && (
                                    <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.message}</p>
                                )}
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="lg" 
                                    className="w-full sm:w-auto px-10 py-4 text-base rounded-xl" 
                                    isLoading={isPending}
                                >
                                    <Send size={20} />
                                    <span>Send Message</span>
                                </Button>
                                
                                <p className="text-xs text-center sm:text-left text-gray-500 dark:text-gray-500 font-medium max-w-[200px]">
                                    By submitting this form, you agree to our <a href="/legal/privacy-policy" className="underline hover:text-gray-300 transition-colors">Privacy Policy</a>.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            
            <SiteFooter />
        </div>
    );
}
