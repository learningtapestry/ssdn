export enum DemoEventType {
  Video = "video",
  DirectFile = "direct-file",
  OneRosterEnrollments = "one-roster-enrollments",
  OneRosterResults = "one-roster-results",
}

export interface DemoEvent {
  id: string;
  type: DemoEventType;
  user: string;
  resource: string;
  description?: string;
  creationDate: Date | string;
  additionalInfo?: any;
}
