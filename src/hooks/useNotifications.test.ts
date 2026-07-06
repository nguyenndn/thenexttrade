import { describe, it, expect, beforeEach } from 'vitest';
import { localNotificationStore } from './useNotifications';

describe('localNotificationStore', () => {
  beforeEach(() => {
    // Mock localStorage if not present in the test environment
    if (typeof window === 'undefined') {
      const store: Record<string, string> = {};
      global.window = {
        localStorage: {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, val: string) => { store[key] = val; },
          removeItem: (key: string) => { delete store[key]; },
          clear: () => { for (const k in store) delete store[k]; }
        }
      } as any;
      global.localStorage = global.window.localStorage;
    } else {
      localStorage.clear();
    }
    
    // Clear notifications before each test
    localNotificationStore.remove('test-nudge');
  });

  it('should add, remove, and mark local notifications as read', () => {
    localNotificationStore.add({
      id: 'test-nudge',
      title: 'Test Title',
      message: 'Test Message',
      isRead: false,
      type: 'COACH_NUDGE',
      createdAt: new Date().toISOString()
    });

    const snapshot = localNotificationStore.getSnapshot();
    const testNudge = snapshot.find(n => n.id === 'test-nudge');
    expect(testNudge).toBeDefined();
    expect(testNudge?.isRead).toBe(false);

    // Mark as read
    localNotificationStore.markAsRead('test-nudge');
    const readSnapshot = localNotificationStore.getSnapshot();
    expect(readSnapshot.find(n => n.id === 'test-nudge')?.isRead).toBe(true);

    // Verify localStorage has the title
    expect(localStorage.getItem('read_local_notification_test-nudge')).toBe('Test Title');

    // Remove
    localNotificationStore.remove('test-nudge');
    expect(localNotificationStore.getSnapshot().some(n => n.id === 'test-nudge')).toBe(false);
  });

  it('should restore isRead state based on localStorage on add', () => {
    localStorage.setItem('read_local_notification_test-nudge', 'Test Title');

    localNotificationStore.add({
      id: 'test-nudge',
      title: 'Test Title',
      message: 'Test Message',
      isRead: false,
      type: 'COACH_NUDGE',
      createdAt: new Date().toISOString()
    });

    const snapshot = localNotificationStore.getSnapshot();
    const testNudge = snapshot.find(n => n.id === 'test-nudge');
    expect(testNudge).toBeDefined();
    expect(testNudge?.isRead).toBe(true); // Should be true because of localStorage!
  });
});
