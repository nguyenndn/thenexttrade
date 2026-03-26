import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-cache';

async function isAdmin() {
    const user = await getAuthUser();
    return user?.profile?.role === 'ADMIN';
}

// GET - List quotes (optionally filter by type)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const activeOnly = searchParams.get('active') === 'true';

        const where: Record<string, unknown> = {};
        if (type) where.type = type;
        if (activeOnly) where.isActive = true;

        const quotes = await prisma.quote.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(quotes);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
    }
}

// POST - Create a new quote
export async function POST(req: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { text, author, type } = body;

        if (!text?.trim()) {
            return NextResponse.json({ error: 'Quote text is required' }, { status: 400 });
        }

        const quote = await prisma.quote.create({
            data: {
                text: text.trim(),
                author: author?.trim() || '',
                type: type || 'DASHBOARD',
            },
        });

        return NextResponse.json(quote);
    } catch (error) {
        console.error('Error creating quote:', error);
        return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
    }
}

// PUT - Update a quote
export async function PUT(req: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, text, author, type, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
        }

        const quote = await prisma.quote.update({
            where: { id },
            data: {
                ...(text !== undefined && { text: text.trim() }),
                ...(author !== undefined && { author: author.trim() }),
                ...(type !== undefined && { type }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(quote);
    } catch (error) {
        console.error('Error updating quote:', error);
        return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
    }
}

// DELETE - Delete a quote
export async function DELETE(req: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
        }

        await prisma.quote.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting quote:', error);
        return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
    }
}
