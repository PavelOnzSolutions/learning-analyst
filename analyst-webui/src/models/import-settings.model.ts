export type FileRole = 'EMPLOYEES' | 'TRAINING_CATALOG' | 'TIMESLOTS' | 'COMPLETED_TRAININGS';

export type DelimiterSetting = 'AUTO' | 'COMMA' | 'SEMICOLON' | 'TAB' | 'PIPE';

export type ImportSettingsMap = Partial<Record<FileRole, DelimiterSetting>>;

export const FILE_ROLE_LABELS: Record<FileRole, string> = {
    COMPLETED_TRAININGS: 'Completed Trainings',
    TRAINING_CATALOG: 'Training Catalog',
    TIMESLOTS: 'Training Timeslots',
    EMPLOYEES: 'Employees',
};

// Matches the fixed box order from the design spec: Completed Trainings, Training Catalog,
// Training Timeslots, Employees.
export const FILE_ROLE_ORDER: FileRole[] = ['COMPLETED_TRAININGS', 'TRAINING_CATALOG', 'TIMESLOTS', 'EMPLOYEES'];
