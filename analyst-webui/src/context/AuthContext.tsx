import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";
import { LoginRequest, TokenResponse, User } from '../models/auth.model';
import config from '../config';
import { TokenStore } from '../utils/TokenStore';

interface AuthContextType {
    user: User | null;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    tokenExpiration: number | null;
    tokenIssuedAt: number | null;
}

interface JwtPayload {
    sub: string;
    exp: number;
    iat: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
    const [tokenExpiration, setTokenExpiration] = useState<number | null>(null);
    const [tokenIssuedAt, setTokenIssuedAt] = useState<number | null>(null);

    const refreshToken = useCallback(async () => {
        const currentToken = TokenStore.getToken();
        if (!currentToken) return;

        try {
            const response = await fetch(`${config.apiBaseUrl}/v1/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const tokenResponse: TokenResponse = await response.json();
            const decoded = jwtDecode<JwtPayload>(tokenResponse.token);

            const updatedUser: User = {
                ...user!,
                token: tokenResponse.token,
                role: tokenResponse.user.role,
            };

            setUser(updatedUser);
            TokenStore.setToken(tokenResponse.token);
            setTokenExpiration(decoded.exp);
            setTokenIssuedAt(decoded.iat);

            scheduleTokenRefresh(decoded.exp);
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
        }
    }, [user]);

    const scheduleTokenRefresh = useCallback((exp: number) => {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }

        const now = Math.floor(Date.now() / 1000);
        const expiresIn = exp - now;
        const refreshIn = Math.max(0, (expiresIn - 60) * 1000);

        const timer = setTimeout(() => {
            refreshToken();
        }, refreshIn);

        setRefreshTimer(timer);
    }, [refreshToken, refreshTimer]);

    useEffect(() => {
        if (user?.token) {
            try {
                const decoded = jwtDecode<JwtPayload>(user.token);
                setTokenExpiration(decoded.exp);
                setTokenIssuedAt(decoded.iat);
                scheduleTokenRefresh(decoded.exp);
            } catch (e) {
                console.error('Failed to decode token for refresh scheduling', e);
            }
        }

        return () => {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }
        };
    }, [user?.token]);

    useEffect(() => {
        const storedToken = TokenStore.getToken();
        const storedUser = TokenStore.getUser();

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const decoded = jwtDecode<JwtPayload>(storedToken);
                setTokenExpiration(decoded.exp);
                setTokenIssuedAt(decoded.iat);
                setUser({ ...parsedUser, token: storedToken });
            } catch (e) {
                console.error('Failed to parse stored user', e);
                TokenStore.clearSession();
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (data: LoginRequest) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${config.apiBaseUrl}/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            const tokenResponse: TokenResponse = await response.json();
            const decoded = jwtDecode<JwtPayload>(tokenResponse.token);

            const newUser: User = {
                id: tokenResponse.user.id,
                username: tokenResponse.user.username || tokenResponse.user.email,
                email: tokenResponse.user.email,
                token: tokenResponse.token,
                role: tokenResponse.user.role,
                imageUrl: tokenResponse.user.avatarUrl || undefined,
            };

            setTokenExpiration(decoded.exp);
            setTokenIssuedAt(decoded.iat);
            setUser(newUser);
            TokenStore.setToken(newUser.token);
            TokenStore.setUser(JSON.stringify({
                id: newUser.id, username: newUser.username, email: newUser.email,
                role: newUser.role, imageUrl: newUser.imageUrl,
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }
        const currentToken = TokenStore.getToken();
        if (currentToken) {
            fetch(`${config.apiBaseUrl}/v1/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                },
            }).catch(() => {});
        }
        setUser(null);
        setTokenExpiration(null);
        setTokenIssuedAt(null);
        TokenStore.clearSession();
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            refreshToken,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'ADMIN',
            isLoading,
            tokenExpiration,
            tokenIssuedAt
        }}>
            {children}
        </AuthContext.Provider>
    );
};
