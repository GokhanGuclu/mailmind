import { useCallback, useState } from 'react';

import type { ApiMessage } from '../../shared/api/messages';
import { InboxScreen } from './InboxScreen';
import { MessageScreen } from './MessageScreen';

type Route =
  | { name: 'inbox' }
  | { name: 'message'; accountId: string; messageId: string; preview: ApiMessage | null };

export function MailNavigator() {
  const [route, setRoute] = useState<Route>({ name: 'inbox' });

  const openMessage = useCallback(
    (accountId: string, messageId: string, preview: ApiMessage | null) => {
      setRoute({ name: 'message', accountId, messageId, preview });
    },
    [],
  );

  const goBack = useCallback(() => setRoute({ name: 'inbox' }), []);

  if (route.name === 'message') {
    return (
      <MessageScreen
        accountId={route.accountId}
        messageId={route.messageId}
        preview={route.preview}
        onBack={goBack}
      />
    );
  }
  return <InboxScreen onOpenMessage={openMessage} />;
}
