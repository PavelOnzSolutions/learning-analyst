import type { ComplianceStatus } from './run.model';

export interface IEmployeeSummary {
    idZamestnance: string;
    jmeno: string | null;
    prijmeni: string | null;
    utvar: string | null;
    pozice: string | null;
    stav: string | null;
}

export interface ITimeslotSummary {
    idTerminu: string;
    kodSkoleni: string | null;
    datum: string | null;
    misto: string | null;
    kapacita: number | null;
    obsazeno: number | null;
    stav: string | null;
    costPerPerson: number | null;
}

export interface IComplianceRecord {
    idZamestnance: string;
    employeeName: string;
    utvar: string | null;
    pozice: string | null;
    kodSkoleni: string;
    nazevSkoleni: string | null;
    status: ComplianceStatus;
    expiryDate: string | null;
    costKc: number | null;
}

export interface ISchedulingOpportunity {
    idZamestnance: string;
    employeeName: string;
    kodSkoleni: string;
    nazevSkoleni: string | null;
    status: ComplianceStatus;
    idTerminu: string;
    datum: string | null;
    kapacita: number | null;
    obsazeno: number | null;
    costPerPerson: number | null;
}

export interface IRunDetailResponse {
    employees: IEmployeeSummary[];
    timeslots: ITimeslotSummary[];
    compliance: IComplianceRecord[];
    schedulingOpportunities: ISchedulingOpportunity[];
}
