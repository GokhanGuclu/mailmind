import { apiRequest } from './client';

export type NotificationType = 'REMINDER_FIRED' | 'AI_PROPOSAL' | 'SYSTEM';

export type ApiNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  /** Kaynak entity türü: 'reminder' | 'calendar_event' | 'task' | null */
  sourceType: string | null;
  /** Kaynak entity id'si */
  sourceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type ListNotificationsOptions = {
  unreadOnly?: boolean;
  /** Server cap'i 200, varsayılan 50. */
  limit?: number;
};

export const notificationsApi = {
  list(accessToken: string, opts: ListNotificationsOptions = {}) {
    const params = new URLSearchParams();
    if (opts.unreadOnly) params.set('unreadOnly', 'true');
    if (opts.limit !== undefined) params.set('limit', String(opts.limit));
    const qs = params.toString();
    const path = qs ? `/notifications?${qs}` : '/notifications';

    return apiRequest<ApiNotification[]>(path, {
      method: 'GET',
      token: accessToken,
    });
  },

  unreadCount(accessToken: string) {
    return apiRequest<{ count: number }>('/notifications/unread-count', {
      method: 'GET',
      token: accessToken,
    });
  },

  markRead(accessToken: string, id: string) {
    return apiRequest<ApiNotification>(`/notifications/${id}/read`, {
      method: 'POST',
      token: accessToken,
    });
  },

  markAllRead(accessToken: string) {
    return apiRequest<{ count: number }>('/notifications/read-all', {
      method: 'POST',
      token: accessToken,
    });
  },
};
