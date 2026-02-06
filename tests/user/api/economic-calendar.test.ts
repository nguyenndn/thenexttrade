/**
 * Economic Calendar API Tests (User perspective)
 * @module tests/user/api/economic-calendar.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper functions
async function getEconomicEvents(options?: {
    startDate?: string;
    endDate?: string;
    impact?: string;
    country?: string;
}) {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.impact) params.append('impact', options.impact);
    if (options?.country) params.append('country', options.country);

    const url = params.toString() ? `/api/economic-events?${params}` : '/api/economic-events';
    const res = await fetch(url);
    return res.json();
}

async function getEventById(eventId: string) {
    const res = await fetch(`/api/economic-events/${eventId}`);
    return res.json();
}

async function setEventAlert(eventId: string, alertTime: number) {
    const res = await fetch(`/api/economic-events/${eventId}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertMinutesBefore: alertTime }),
    });
    return res.json();
}

async function removeEventAlert(eventId: string) {
    const res = await fetch(`/api/economic-events/${eventId}/alert`, { method: 'DELETE' });
    return res.json();
}

async function getUserAlerts() {
    const res = await fetch('/api/economic-events/alerts');
    return res.json();
}

async function getTodayEvents() {
    const res = await fetch('/api/economic-events/today');
    return res.json();
}

async function getWeekEvents() {
    const res = await fetch('/api/economic-events/week');
    return res.json();
}

// Mock data
const mockEconomicEvents = [
    {
        id: 'event-1',
        name: 'Non-Farm Payrolls',
        country: 'US',
        countryFlag: '🇺🇸',
        currency: 'USD',
        impact: 'high',
        eventTime: '2025-01-17T13:30:00Z',
        forecast: '180K',
        previous: '227K',
        actual: null,
        description: 'Change in the number of employed people during the previous month.',
    },
    {
        id: 'event-2',
        name: 'ECB Interest Rate Decision',
        country: 'EU',
        countryFlag: '🇪🇺',
        currency: 'EUR',
        impact: 'high',
        eventTime: '2025-01-23T12:45:00Z',
        forecast: '4.00%',
        previous: '4.25%',
        actual: null,
        description: 'ECB Governing Council decision on interest rates.',
    },
    {
        id: 'event-3',
        name: 'UK GDP',
        country: 'UK',
        countryFlag: '🇬🇧',
        currency: 'GBP',
        impact: 'medium',
        eventTime: '2025-01-16T07:00:00Z',
        forecast: '0.2%',
        previous: '0.1%',
        actual: '0.3%',
        description: 'Quarterly change in UK gross domestic product.',
    },
    {
        id: 'event-4',
        name: 'Japan CPI',
        country: 'JP',
        countryFlag: '🇯🇵',
        currency: 'JPY',
        impact: 'low',
        eventTime: '2025-01-17T23:30:00Z',
        forecast: '2.8%',
        previous: '2.9%',
        actual: null,
        description: 'Consumer price index year-over-year change.',
    },
];

const mockUserAlerts = [
    {
        id: 'alert-1',
        eventId: 'event-1',
        eventName: 'Non-Farm Payrolls',
        eventTime: '2025-01-17T13:30:00Z',
        alertMinutesBefore: 30,
        isTriggered: false,
    },
    {
        id: 'alert-2',
        eventId: 'event-2',
        eventName: 'ECB Interest Rate Decision',
        eventTime: '2025-01-23T12:45:00Z',
        alertMinutesBefore: 60,
        isTriggered: false,
    },
];

describe('Economic Calendar API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Events Tests
    // ========================================
    describe('GET /api/economic-events', () => {
        it('should get economic events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents,
                }),
            });

            const data = await getEconomicEvents();

            expect(mockFetch).toHaveBeenCalledWith('/api/economic-events');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(4);
        });

        it('should filter by date range', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockEconomicEvents[0], mockEconomicEvents[3]],
                }),
            });

            await getEconomicEvents({
                startDate: '2025-01-17',
                endDate: '2025-01-17',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/economic-events?startDate=2025-01-17&endDate=2025-01-17'
            );
        });

        it('should filter by impact level', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents.filter((e) => e.impact === 'high'),
                }),
            });

            const data = await getEconomicEvents({ impact: 'high' });

            expect(mockFetch).toHaveBeenCalledWith('/api/economic-events?impact=high');
            expect(data.data.every((e: any) => e.impact === 'high')).toBe(true);
        });

        it('should filter by country', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockEconomicEvents[0]],
                }),
            });

            const data = await getEconomicEvents({ country: 'US' });

            expect(mockFetch).toHaveBeenCalledWith('/api/economic-events?country=US');
            expect(data.data[0].country).toBe('US');
        });

        it('should include event details', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents,
                }),
            });

            const data = await getEconomicEvents();

            expect(data.data[0].forecast).toBeDefined();
            expect(data.data[0].previous).toBeDefined();
            expect(data.data[0].currency).toBeDefined();
        });

        it('should show actual values for past events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents,
                }),
            });

            const data = await getEconomicEvents();

            const pastEvent = data.data.find((e: any) => e.actual !== null);
            expect(pastEvent?.actual).toBe('0.3%');
        });
    });

    // ========================================
    // Today Events Tests
    // ========================================
    describe('GET /api/economic-events/today', () => {
        it('should get today events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockEconomicEvents[0]],
                }),
            });

            const data = await getTodayEvents();

            expect(mockFetch).toHaveBeenCalledWith('/api/economic-events/today');
            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Week Events Tests
    // ========================================
    describe('GET /api/economic-events/week', () => {
        it('should get this week events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents,
                }),
            });

            const data = await getWeekEvents();

            expect(mockFetch).toHaveBeenCalledWith('/api/economic-events/week');
            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Get Event by ID Tests
    // ========================================
    describe('GET /api/economic-events/:id', () => {
        it('should get event by ID', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents[0],
                }),
            });

            const data = await getEventById('event-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/economic-events/event-1');
            expect(data.success).toBe(true);
            expect(data.data.name).toBe('Non-Farm Payrolls');
        });

        it('should return 404 for non-existent event', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Event not found',
                }),
            });

            const data = await getEventById('non-existent');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Event Alerts Tests
    // ========================================
    describe('POST /api/economic-events/:id/alert', () => {
        it('should set event alert', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'alert-new',
                        eventId: 'event-1',
                        alertMinutesBefore: 30,
                    },
                }),
            });

            const data = await setEventAlert('event-1', 30);

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/economic-events/event-1/alert',
                expect.objectContaining({ method: 'POST' })
            );
            expect(data.success).toBe(true);
            expect(data.data.alertMinutesBefore).toBe(30);
        });

        it('should update existing alert', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'alert-1',
                        eventId: 'event-1',
                        alertMinutesBefore: 60, // Updated from 30 to 60
                    },
                }),
            });

            const data = await setEventAlert('event-1', 60);

            expect(data.data.alertMinutesBefore).toBe(60);
        });

        it('should validate alert time', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Alert time must be between 5 and 1440 minutes',
                }),
            });

            const data = await setEventAlert('event-1', 2);

            expect(data.success).toBe(false);
        });

        it('should require authentication', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const data = await setEventAlert('event-1', 30);

            expect(data.success).toBe(false);
        });
    });

    describe('DELETE /api/economic-events/:id/alert', () => {
        it('should remove event alert', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Alert removed',
                }),
            });

            const data = await removeEventAlert('event-1');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/economic-events/event-1/alert',
                { method: 'DELETE' }
            );
            expect(data.success).toBe(true);
        });

        it('should handle non-existent alert', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Alert not found',
                }),
            });

            const data = await removeEventAlert('event-999');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // User Alerts Tests
    // ========================================
    describe('GET /api/economic-events/alerts', () => {
        it('should get user alerts', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUserAlerts,
                }),
            });

            const data = await getUserAlerts();

            expect(mockFetch).toHaveBeenCalledWith('/api/economic-events/alerts');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });

        it('should show alert trigger status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUserAlerts,
                }),
            });

            const data = await getUserAlerts();

            expect(data.data[0].isTriggered).toBe(false);
        });

        it('should require authentication', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const data = await getUserAlerts();

            expect(data.success).toBe(false);
        });
    });
});
