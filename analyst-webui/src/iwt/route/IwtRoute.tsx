import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { mountIWT, type MountHandle } from '../app/mount';
import { iwtCtxFor, RealAuthAdapter, RealProfileAdapter } from '../providers/real-auth';
import { GUEST_TREE, useIwtMenu } from '../providers/real-menu';
import { dashboardPanelHtml, instancesPanelHtml, subscriptionPanelHtml, loadingPanelHtml } from '../render/overlay/real-panels';
import {useAuth} from "../../context/AuthContext.tsx";

/**
 * Mounts the real IWT app at /iwt/app and /iwt/app/:section. Unlike /app,
 * this route is not behind RequireRole — the login orb opens IWT's own
 * dialog (email/password, or a "Sign in with Microsoft" button re-skinning
 * the real MSAL redirect), so guests must be able to reach this route to
 * see it.
 */
export function IwtRoute() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<MountHandle | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();

  const menuQuery = useIwtMenu(auth.isAuthenticated);

  // Mount the render loop once. login/navigate identities are stable enough
  // (useAuth's login is memoized; react-router's navigate is stable) that a
  // one-time mount capturing them is fine — auth state itself is synced into
  // the store separately below, not through this closure.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const handle = mountIWT(root, {
      auth: new RealAuthAdapter(auth),
      profileProvider: new RealProfileAdapter(),
      initialTree: auth.isAuthenticated ? [] : GUEST_TREE,
      navigate: (to) => navigate(`/iwt/app/${to}`, { replace: true }),
      loginLocal: async ({ email, password }) => {
        try {
          await auth.login({login: email, password: password});
          // Forces a re-render so useAuth() picks up the new local session below.
          navigate('/iwt/app', { replace: true });
          return { ok: true, value: undefined };
        } catch (err) {
          return { ok: false, error: 'Sign-in failed. Try again.' };
        }
      },
    });
    handleRef.current = handle;
    return () => {
      handle.stop();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync real auth state into the store's signals on every change.
  useEffect(() => {
    const store = handleRef.current?.store;
    if (!store) return;
    const ctx = iwtCtxFor(auth);
    store.status.set(ctx.status);
    store.role.set(ctx.role);
    store.profile.set(ctx.profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.roles, auth.account]);

  // Sync the real menu tree (or the guest tree) into the store.
  useEffect(() => {
    const store = handleRef.current?.store;
    if (!store) return;
    store.tree.set(auth.isAuthenticated ? (menuQuery.data ?? []) : GUEST_TREE);
  }, [auth.isAuthenticated, menuQuery.data]);

  // Land on the section named in the URL, if it matches a top-level orb.
  useEffect(() => {
    const store = handleRef.current?.store;
    if (!store || !section) return;
    if (store.path.get().length > 0) return;
    const node = store.visibleRoot().find((n) => n.id === section);
    if (node) {
      store.expanded.set(true);
      store.drill(node, 0);
    }
  }, [section, menuQuery.data]);

  // Mirror the top-level trail back into the URL.
  useEffect(() => {
    const store = handleRef.current?.store;
    if (!store) return;
    return store.path.subscribe((path) => {
      const top = path[0]?.node.id;
      navigate(top ? `/iwt/app/${top}` : '/iwt/app', { replace: true });
    });
  }, [navigate]);

  // Render whichever stub panel is currently open, from real API data.
  useEffect(() => {
    const store = handleRef.current?.store;
    const page = handleRef.current?.page;
    if (!store || !page) return;

    const renderActivePanel = () => {
      if (store.morphKind.get() !== 'page') return;
      const key = store.morphKey.get();
      if (key === 'dashboard') {
        page.setBody(dashboardQuery.data ? dashboardPanelHtml(dashboardQuery.data) : loadingPanelHtml());
      } else if (key === 'instances') {
        page.setBody(instancesQuery.data ? instancesPanelHtml(instancesQuery.data) : loadingPanelHtml());
      } else if (key === 'subscription') {
        page.setBody(subscriptionQuery.data ? subscriptionPanelHtml(subscriptionQuery.data) : loadingPanelHtml());
      }
    };

    renderActivePanel();
    return store.morphKind.subscribe(renderActivePanel);
  }, [dashboardQuery.data, instancesQuery.data, subscriptionQuery.data]);

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0 }} />;
}
