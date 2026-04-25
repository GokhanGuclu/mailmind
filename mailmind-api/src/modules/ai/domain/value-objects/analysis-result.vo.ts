export type TaskResult = {
  title: string;
  notes?: string;
  dueAt?: Date | null;
  rrule?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
};

export type CalendarEventResult = {
  title: string;
  startAt: Date;
  endAt?: Date | null;
  location?: string | null;
  attendees?: string[];
  rrule?: string | null;
  timezone?: string;
};

export type ReminderResult = {
  title: string;
  notes?: string | null;
  fireAt?: Date | null;
  rrule?: string | null;
  timezone?: string;
};

export type AnalysisResult = {
  summary: string;
  tasks: TaskResult[];
  calendarEvents: CalendarEventResult[];
  reminders: ReminderResult[];
};
