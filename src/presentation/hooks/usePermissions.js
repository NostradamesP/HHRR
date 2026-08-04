import { useMemo } from "react";
import { effectiveLevel, canCreate, canFullEdit } from "../../core/domain/constants/roles";

/**
 * usePermissions — deriva nivel, creación/edición y actor desde el usuario actual.
 * usePermissions — derives level, create/edit flags and actor from the current user.
 */
export function usePermissions({ isAdmin, isLocalDemo, appUser, appUserData }) {
  const appRole = appUserData?.role || "member";
  const appIsAdmin = isAdmin || isLocalDemo;
  const appActor = useMemo(
    () => ({
      uid: appUser?.uid || null,
      role: appUserData?.role,
      jobTitle: appUserData?.jobTitle,
    }),
    [appUser?.uid, appUserData?.role, appUserData?.jobTitle],
  );
  const appUserLevel = isLocalDemo
    ? "manager"
    : effectiveLevel({ jobTitle: appUserData?.jobTitle });
  const appCanCreate = appIsAdmin || canCreate(appActor);
  const appCanEdit = appIsAdmin || canFullEdit(appActor);

  return { appRole, appIsAdmin, appActor, appUserLevel, appCanCreate, appCanEdit };
}
