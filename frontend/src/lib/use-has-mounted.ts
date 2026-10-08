import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// false on the server and during hydration; used for anything that depends on the user's clock
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
