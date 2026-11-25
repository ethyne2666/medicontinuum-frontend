import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '@/api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then((r) => setMe(r.entity)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => { tokenStore.clear(); setMe(null); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const refreshMe = useCallback(async () => { const r = await api.me(); setMe(r.entity); }, []);

  const value = useMemo(() => {
    const accept = ({ token, entity }) => { tokenStore.set(token); setMe(entity); return entity; };
    return {
      me,
      loading,
      refreshMe,
      login: async (orgNumber, password) => accept(await api.login({ orgNumber, password })),
      signup: async (payload) => accept(await api.signup(payload)),
      logout: () => { tokenStore.clear(); setMe(null); },
    };
  }, [me, loading, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
