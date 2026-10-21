import type { FileRole } from './import-settings.model';

export type RunStatus = 'PENDING_REVIEW' | 'COMPLETED';

export type FindingSeverity = 'ERROR' | 'WARNING';

export type ComplianceStatus = 'COMPLIANT' | 'EXPIRING_SOON' | 'OVERDUE';

export interface IFinding {
    severity: FindingSeverity;
    file: FileRole;
    row: number;
    field: string | null;
    message: string;
}

export interface ICounts {
    employees: number;
    trainingCatalogEntries: number;
    timeslots: number;
    completedTrainings: number;
    errorCount: number;
    warningCount: number;
    compliantCount: number;
    expiringSoonCount: number;
    overdueCount: number;
}

export interface IRunResponse {
    id: string;
    name: string;
    status: RunStatus;
    createdAt: string;
    confirmedAt: string | null;
    createdBy: string;
    counts: ICounts;
    findings: IFinding[];
}
