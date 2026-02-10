'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export function CreateBrokerButton() {
    const router = useRouter();

    return (
        <Button
            onClick={() => router.push('/admin/brokers/create')}
            variant="primary"
            className="bg-primary hover:bg-[#00B078] text-white shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all px-6 py-2.5 h-auto text-base font-bold rounded-xl border-0"
        >
            <Plus size={20} />
            Add New Broker
        </Button>
    );
}
