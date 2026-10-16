import { describe, it, expect, beforeEach } from 'vitest';
import { TokenStore } from '../TokenStore';

describe('TokenStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getToken returns null when nothing is stored', () => {
    expect(TokenStore.getToken()).toBeNull();
  });

  it('setToken then getToken round-trips the value', () => {
    TokenStore.setToken('abc.def.ghi');
    expect(TokenStore.getToken()).toBe('abc.def.ghi');
    expect(localStorage.getItem('token')).toBe('abc.def.ghi');
  });

  it('getUser returns null when nothing is stored', () => {
    expect(TokenStore.getUser()).toBeNull();
  });

  it('setUser then getUser round-trips the value', () => {
    TokenStore.setUser('{"id":"u1"}');
    expect(TokenStore.getUser()).toBe('{"id":"u1"}');
    expect(localStorage.getItem('user')).toBe('{"id":"u1"}');
  });

  it('clearSession removes both token and user', () => {
    TokenStore.setToken('abc');
    TokenStore.setUser('{"id":"u1"}');
    TokenStore.clearSession();
    expect(TokenStore.getToken()).toBeNull();
    expect(TokenStore.getUser()).toBeNull();
  });
});
