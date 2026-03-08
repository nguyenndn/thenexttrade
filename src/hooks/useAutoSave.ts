import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';

const AUTO_SAVE_KEY = 'gsn_article_draft';

export function useAutoSave<T>(currentData: T, articleId?: string) {
    const [draftAutoSavedAt, setDraftAutoSavedAt] = useState<Date | null>(null);
    const [hasHydrated, setHasHydrated] = useState(false);
    
    // 3 seconds debounce for auto-saving
    const [debouncedData] = useDebounce(currentData, 3000); 
    const storageKey = articleId ? `${AUTO_SAVE_KEY}_${articleId}` : `${AUTO_SAVE_KEY}_new`;

    // Prevent saving on initial render empty state
    useEffect(() => {
        setHasHydrated(true);
    }, []);

    // Save to local storage when debounced data changes
    useEffect(() => {
        if (!hasHydrated || !debouncedData) return;
        
        try {
            // Ignore if it looks like an completely empty initial state (optional, depends on T)
            // Save the data to local storage
            const dataToSave = {
                data: debouncedData,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            setDraftAutoSavedAt(new Date());
        } catch (error) {
            console.error('Failed to autosave draft', error);
        }
    }, [debouncedData, storageKey, hasHydrated]);

    const getDraft = useCallback(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    data: parsed.data as T,
                    timestamp: new Date(parsed.timestamp)
                };
            }
        } catch (error) {
            console.error('Failed to parse autosave draft', error);
        }
        return null;
    }, [storageKey]);

    const clearDraft = useCallback(() => {
        localStorage.removeItem(storageKey);
        setDraftAutoSavedAt(null);
    }, [storageKey]);

    return { getDraft, clearDraft, draftAutoSavedAt };
}
