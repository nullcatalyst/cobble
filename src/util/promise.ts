export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce(delay: number): () => Promise<void> {
    let timeout: NodeJS.Timeout | null = null;

    // `reset` and `p` must both contain valid values if `timeout` is not null
    let reset: () => void;
    let p: Promise<void>;

    if (delay === 0) {
        return () => Promise.resolve();
    }

    return () => {
        if (timeout != null) {
            clearTimeout(timeout);
            timeout = setTimeout(reset, delay);
            return p;
        }

        p = new Promise(resolve => {
            reset = () => {
                timeout = null;
                resolve();
            };
            timeout = setTimeout(reset, delay);
        });
        return p;
    };
}
