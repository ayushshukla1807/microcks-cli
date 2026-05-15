export interface TestResultSummary {
  id: string;
  version: number;
  testNumber: number;
  testDate: number;
  testedEndpoint: string;
  serviceId: string;
  elapsedTime: number;
  success: boolean;
  inProgress: boolean;
}
