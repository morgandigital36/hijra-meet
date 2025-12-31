import { useEffect, useState, useRef } from 'react';

export const useAudioLevel = (stream) => {
    const [audioLevel, setAudioLevel] = useState(0);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const requestRef = useRef(null);

    useEffect(() => {
        if (!stream || !stream.getAudioTracks().length) {
            setTimeout(() => setAudioLevel(0), 0);
            return;
        }

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack.enabled) {
            setTimeout(() => setAudioLevel(0), 0);
            // We still need to listen in case it gets enabled, 
            // but for now let's just cleanup if track changes
        }

        try {
            // New AudioContext
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            // Analyser
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            // Source
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            // Analysis loop
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const analyze = () => {
                analyser.getByteFrequencyData(dataArray);

                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;

                // Normalize to 0-100 (approximate, adjust scale as needed)
                // Typical values are low, so multiply
                const normalized = Math.min(100, average * 2.5);

                setAudioLevel(normalized);
                requestRef.current = requestAnimationFrame(analyze);
            };

            analyze();

        } catch (err) {
            console.error('Error initializing AudioContext:', err);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.error("Error closing AudioContext", e));
            }
        };
    }, [stream]);

    return { audioLevel, isSpeaking: audioLevel > 10 };
};
