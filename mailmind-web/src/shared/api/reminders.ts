import { apiRequest } from './client';

export type ReminderStatus = 'PROPOSED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type UpdatableReminderStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export type ApiReminder = {
  id: string;
  userId: string;
  aiAnalysisId: string | null;
  title: string;
  notes: string | null;
  fireAt: string | null;
  rrule: string | null;
  timezone: string;
  nextFireAt: string | null;
  lastFiredAt: string | null;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateReminderPayload = {
  title: string;
  notes?: string;
  fireAt?: string;     // ISO 8601
  rrule?: string;      // örn 'FREQ=DAILY' veya 'FREQ=WEEKLY;BYDAY=MO'
  timezone?: string;
};

export type UpdateReminderPayload = Partial<CreateReminderPayload> & {
  status?: UpdatableReminderStatus;
  // null göndermek izinli (rrule temizlemek için)
  rrule?: string | null;
  fireAt?: string | null;
};

export const remindersApi = {
  list(accessToken: string, statusCsv?: string) {
    const path = statusCsv ? `/reminders?status=${encodeURIComponent(statusCsv)}` : '/reminders';
    return apiRequest<ApiReminder[]>(path, { method: 'GET', token: accessToken });
  },

  getOne(accessToken: string, id: string) {
    return apiRequest<ApiReminder>(`/reminders/${id}`, { method: 'GET', token: accessToken });
  },

  create(accessToken: string, payload: CreateReminderPayload) {
    return apiRequest<ApiReminder>('/reminders', {
      method: 'POST',
      token: accessToken,
      body: payload,
    });
  },

  update(accessToken: string, id: string, payload: UpdateReminderPayload) {
    return apiRequest<ApiReminder>(`/reminders/${id}`, {
      method: 'PATCH',
      token: accessToken,
      body: payload,
    });
  },

  remove(accessToken: string, id: string) {
    return apiRequest<{ deleted: boolean }>(`/reminders/${id}`, {
      method: 'DELETE',
      token: accessToken,
    });
  },
};
