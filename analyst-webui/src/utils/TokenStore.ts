const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const TokenStore = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): string | null {
    return localStorage.getItem(USER_KEY);
  },
  setUser(userJson: string): void {
    localStorage.setItem(USER_KEY, userJson);
  },
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
