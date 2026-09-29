import type { Session } from './auth';

type CloudStatus = 'offline' | 'connecting' | 'connected';
const listeners = new Set<(status: CloudStatus) => void>();
let status: CloudStatus = 'offline';

export function setCloudStatus(next: CloudStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach(fn => fn(status));
}

export function getCloudStatus() { return status; }

export function subscribeCloudStatus(fn: (status: CloudStatus) => void) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

export function sessionIsStaff(session: Session | null) {
  return !!session && session.role !== 'patient';
}
