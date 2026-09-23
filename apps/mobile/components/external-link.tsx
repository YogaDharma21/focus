import { Href, Link } from 'expo-router';
import { type ComponentProps } from 'react';
import { useAppStore } from '@/lib/store';
import { DEFAULT_SHIELD, isShieldActive, isUrlBlocked } from '@/lib/shield';
import { openGuardedUrl } from '@/lib/shieldGuard';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS === 'web') {
          // On web, only intercept when Shield would block; otherwise let the
          // default navigation proceed to avoid opening the URL twice.
          const { shield, isActive, timerState } = useAppStore.getState();
          const activeShield = shield ?? DEFAULT_SHIELD;
          const blocked =
            isShieldActive(activeShield.enabled, isActive, timerState) &&
            isUrlBlocked(href, activeShield.blockedSites, activeShield.allowedSites);
          if (!blocked) return;
          event.preventDefault();
          await openGuardedUrl(href);
          return;
        }
        // Prevent the default behavior of linking to the default browser on native.
        event.preventDefault();
        // Open the link in an in-app browser, guarded by Shield.
        await openGuardedUrl(href);
      }}
    />
  );
}
