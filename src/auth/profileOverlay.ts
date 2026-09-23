export type ProfileOverlay = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

type OverlayUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  avatarUrl?: string;
};

function key(userId: string) {
  return `axm_profile_${userId}`;
}

export function readProfileOverlay(userId: string): ProfileOverlay {
  try {
    return JSON.parse(localStorage.getItem(key(userId)) ?? '{}') as ProfileOverlay;
  } catch {
    return {};
  }
}

export function writeProfileOverlay(userId: string, patch: ProfileOverlay) {
  const next = { ...readProfileOverlay(userId), ...patch };
  localStorage.setItem(key(userId), JSON.stringify(next));
  return next;
}

export function applyProfileOverlay<T extends OverlayUser>(user: T): T {
  const overlay = readProfileOverlay(user.id);
  return {
    ...user,
    name: overlay.name ?? user.name,
    email: overlay.email ?? user.email,
    avatarUrl: overlay.avatarUrl ?? user.avatarUrl,
  };
}
