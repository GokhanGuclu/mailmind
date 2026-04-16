export type TaskResult = {
  title: string;
  notes?: string;
  dueAt?: Date | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
};

export type CalendarEventResult = {
  title: string;
  startAt: Date;
  endAt?: Date | null;
  location?: string | null;
  attendees?: string[];
};

export type AnalysisResult = {
  summary: string;
  tasks: TaskResult[];
  calendarEvents: CalendarEventResult[];
};
