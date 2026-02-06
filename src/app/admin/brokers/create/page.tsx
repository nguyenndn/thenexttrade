'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBroker } from '@/app/actions/brokers';
import { Briefcase, ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { Button } from '@/components/ui/Button';

export default function CreateBrokerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
    const [rating, setRating] = useState('5.0');
    const [summary, setSummary] = useState('');
    const [features, setFeatures] = useState<string[]>([]);
    const [featureInput, setFeatureInput] = useState('');
    const [affiliateUrl, setAffiliateUrl] = useState('');

    const handleAddFeature = () => {
        if (!featureInput.trim()) return;
        setFeatures([...features, featureInput.trim()]);
        setFeatureInput('');
    };

    const handleRemoveFeature = (idx: number) => {
        setFeatures(features.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        try {
            const result = await createBroker({
                name,
                slug,
                logo,
                rating: parseFloat(rating),
                summary,
                features,
                affiliateUrl,
                isRecommended: false,
                isVisible: true
            });

            if (result.success) {
                toast.success('Broker created successfully!');
                router.push('/admin/brokers');
            } else {
                toast.error(result.error || 'Failed to create broker');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <Link href="/admin/brokers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#00C888] transition-colors">
                <ArrowLeft size={16} />
                Back to Brokers
            </Link>

            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                <h1 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-2">
                    <Briefcase className="text-[#00C888]" />
                    Add New Broker
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <PremiumInput
                        label="Broker Name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Exness"
                    />

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Logo</label>
                        <ImageUploader
                            value={logo}
                            onChange={setLogo}
                            className="bg-white dark:bg-black/20 w-40"
                        />
                        <p className="text-xs text-gray-400 mt-2">Recommended: Transparent PNG, Square aspect ratio.</p>
                    </div>

                    {/* Rating */}
                    <PremiumInput
                        label="Rating (0-5)"
                        type="number"
                        required
                        min={0}
                        max={5}
                        step={0.1}
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                    />

                    {/* Summary */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Summary</label>
                        <textarea
                            required
                            rows={3}
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#00C888]/50 focus-visible:border-[#00C888] transition-all placeholder:text-gray-400 text-gray-900 dark:text-white"
                            placeholder="Short description (e.g. Instant withdrawals...)"
                        />
                    </div>

                    {/* Features Array */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Features</label>
                        <div className="flex gap-2 mb-3">
                            <PremiumInput
                                value={featureInput}
                                onChange={(e) => setFeatureInput(e.target.value)}
                                placeholder="Add feature..."
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                onClick={handleAddFeature}
                                variant="secondary"
                                className="px-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white border-0"
                            >
                                <Plus size={20} />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {features.map((feat, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-[#00C888]/10 text-[#00C888] rounded-full text-sm font-medium border border-[#00C888]/20">
                                    {feat}
                                    <Button
                                        type="button"
                                        onClick={() => handleRemoveFeature(idx)}
                                        variant="ghost"
                                        className="hover:text-red-500 p-1 h-auto w-auto min-h-0"
                                    >
                                        <X size={14} />
                                    </Button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Affiliate URL */}
                    <PremiumInput
                        label="Affiliate / Open Account Link"
                        type="url"
                        value={affiliateUrl}
                        onChange={(e) => setAffiliateUrl(e.target.value)}
                        placeholder="https://..."
                    />

                    <div className="pt-4 border-t dark:border-white/10 flex justify-end">
                        <Button
                            type="submit"
                            disabled={loading}
                            isLoading={loading}
                            className="w-full md:w-auto px-8 py-3 h-auto text-base font-bold rounded-xl bg-[#00C888] hover:bg-[#00B078] text-white shadow-lg hover:shadow-[#00C888]/25 hover:-translate-y-0.5 transition-all"
                        >
                            {!loading && <Briefcase size={20} />}
                            Create Broker
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
