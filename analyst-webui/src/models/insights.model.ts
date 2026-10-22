import type { ComplianceStatus } from './run.model';
import type { ISchedulingOpportunity } from './run-detail.model';

export interface IRunTrendPoint {
    runId: string;
    runName: string;
    confirmedAt: string | null;
    employees: number;
    compliantCount: number;
    expiringSoonCount: number;
    overdueCount: number;
    errorCount: number;
    warningCount: number;
    totalCostKc: number;
}

export interface IInsightsOverviewResponse {
    runTrends: IRunTrendPoint[];
}

export interface IEmployeeOption {
    idZamestnance: string;
    displayName: string;
}

export interface IEmployeeHistoryPoint {
    runId: string;
    runName: string;
    confirmedAt: string | null;
    kodSkoleni: string;
    nazevSkoleni: string | null;
    status: ComplianceStatus;
    expiryDate: string | null;
    costKc: number | null;
}

export interface IEmployeeHistoryResponse {
    idZamestnance: string;
    employeeName: string;
    history: IEmployeeHistoryPoint[];
}

export interface IInsightsSchedulingSuggestionsResponse {
    basedOnRunId: string | null;
    basedOnRunName: string | null;
    suggestions: ISchedulingOpportunity[];
}
