import { useEffect, useState } from "react";

/**
 * useUsers — suscripción de usuarios visibles (solo admin). Local demo: lista vacía.
 * useUsers — subscription of visible users (admin only). Local demo: empty list.
 */
export function useUsers({ isLocalDemo, user, userData, appIsAdmin, userService }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isLocalDemo) {
      setUsers([]);
      return;
    }
    if (!user) {
      setUsers([]);
      return;
    }
    if (!appIsAdmin) {
      setUsers(userData ? [{ id: user.uid, ...userData }] : []);
      return;
    }
    return userService.subscribeUsers(
      (next) => setUsers(next),
      (err) => {
        if (import.meta.env.DEV) console.error("Users listener error:", err);
      },
    );
  }, [user, userData, appIsAdmin, isLocalDemo, userService]);

  return { users };
}
