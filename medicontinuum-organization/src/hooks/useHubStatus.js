import { useSyncExternalStore } from 'react';
import { hubStatus, onHubStatus } from '@/lib/hub';

export const useHubStatus = () => useSyncExternalStore(onHubStatus, hubStatus, () => 'local');
