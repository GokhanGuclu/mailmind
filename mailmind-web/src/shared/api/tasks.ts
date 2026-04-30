import { apiRequest } from './client';

export type TaskStatus = 'PROPOSED' | 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type ApiTask = {
  id: string;
  userId: string;
  aiAnalysisId: string | null;
  title: string;
  notes: string | null;
  dueAt: string | null;
  rrule?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskPayload = {
  title: string;
  notes?: string;
  dueAt?: string;
  priority?: TaskPriority;
};

export type UpdateTaskPayload = Partial<CreateTaskPayload> & {
  status?: TaskStatus;
};

export const tasksApi = {
  list(accessToken: string) {
    return apiRequest<ApiTask[]>('/tasks', { method: 'GET', token: accessToken });
  },

  getOne(accessToken: string, id: string) {
    return apiRequest<ApiTask>(`/tasks/${id}`, { method: 'GET', token: accessToken });
  },

  create(accessToken: string, payload: CreateTaskPayload) {
    return apiRequest<ApiTask>('/tasks', {
      method: 'POST',
      token: accessToken,
      body: payload,
    });
  },

  update(accessToken: string, id: string, payload: UpdateTaskPayload) {
    return apiRequest<ApiTask>(`/tasks/${id}`, {
      method: 'PATCH',
      token: accessToken,
      body: payload,
    });
  },

  remove(accessToken: string, id: string) {
    return apiRequest<{ deleted: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
      token: accessToken,
    });
  },
};
