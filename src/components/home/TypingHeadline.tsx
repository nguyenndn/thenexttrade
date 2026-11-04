"use client";

import { useEffect, useState } from "react";

export const PHRASES = [
    "not doing it.",
    "moving the stop.",
    "revenge sizing.",
    "breaking your own rules.",
];

const TYPE_SPEED_MS = 75;
const DELETE_SPEED_MS = 40;
const HOLD_MS = 2200;

export function TypingHeadline() {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const currentPhrase = PHRASES[phraseIndex];

    useEffect(() => {
        const fullText = currentPhrase;
        let timer: NodeJS.Timeout;

        if (!isDeleting) {
            if (displayedText.length < fullText.length) {
                timer = setTimeout(() => {
                    setDisplayedText(
                        fullText.slice(0, displayedText.length + 1)
                    );
                }, TYPE_SPEED_MS);
            } else {
                timer = setTimeout(() => {
                    setIsDeleting(true);
                }, HOLD_MS);
            }
        } else {
            if (displayedText.length > 0) {
                timer = setTimeout(() => {
                    setDisplayedText(
                        fullText.slice(0, displayedText.length - 1)
                    );
                }, DELETE_SPEED_MS);
            } else {
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
            }
        }

        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, phraseIndex, currentPhrase]);

    return (
        <span className="block mt-1 sm:mt-2 min-h-[1.15em] whitespace-nowrap">
            You keep{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-gold to-amber-600 dark:from-gold dark:via-yellow-300 dark:to-amber-400 drop-shadow-sm pb-[0.25em] -mb-[0.25em]">
                {displayedText || "\u00A0"}
            </span>
            <span
                className="inline-block w-1.5 sm:w-2.5 md:w-3 h-5 sm:h-8 md:h-10 lg:h-11 xl:h-13 2xl:h-14 ml-1 sm:ml-1.5 align-middle rounded-full bg-gold shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                style={{ animation: "terminalBlink 1s infinite" }}
            />
        </span>
    );
}
