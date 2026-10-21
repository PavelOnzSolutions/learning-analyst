interface Config {
    apiBaseUrl: string;
    baseUrl: string;
    wsUrl: string;
    brand: string;
    version: string;
    prod: boolean;
}

const config: Config = {
    apiBaseUrl: (import.meta.env.VITE_BASE_URL || 'https://api.learning.zkrabice.cz') + '/api',
    baseUrl: (import.meta.env.VITE_BASE_URL || 'https://api.learning.zkrabice.cz'),
    wsUrl: import.meta.env.VITE_WS_URL || 'https://api.learning.zkrabice.cz/ws',
    brand: import.meta.env.VITE_BRAND || '',
    version: import.meta.env.VITE_VERSION || '1.0.0',
    prod: import.meta.env.VITE_PROD || false,
};

export default config;
