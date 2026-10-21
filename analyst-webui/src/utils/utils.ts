import {EAuditLogType} from "../models/audit-log.model.ts";
import i18n from "../i18n.ts";

/**
 * Converts an audit log type to a human-readable label.
 * @param type - The audit log type to convert.
 * @returns The human-readable label for the audit log type.
 */
export const auditLogTypeToLabel = (type: EAuditLogType) => {
    switch (type) {
        case EAuditLogType.ENTITY_CHANGE:
            return i18n.t('lbl_audit_log_type_entity_change', 'Entity Change');
        case EAuditLogType.ENTITY_VERSION:
            return i18n.t('lbl_audit_log_type_entity_version', 'Entity Version');
        case EAuditLogType.USER_ACTION:
            return i18n.t('lbl_audit_log_type_user_action', 'User Action');
        case EAuditLogType.AUTHORIZATION:
            return i18n.t('lbl_audit_log_type_authorization', 'Authorization');
        case EAuditLogType.SYSTEM_EVENT:
            return i18n.t('lbl_audit_log_type_system_event', 'System Event');
        case EAuditLogType.DEPLOYMENT:
            return i18n.t('lbl_audit_log_type_deployment', 'Deployment');
        case EAuditLogType.BACKUP:
            return i18n.t('lbl_audit_log_type_backup', 'Backup');
        case EAuditLogType.RESTORE:
            return i18n.t('lbl_audit_log_type_restore', 'Restore');
        default:
            return type;
    }
};

/**
 * Maps a given credential type identifier to a formatted label.
 *
 * This function takes a string representing a credential type that is typically
 * in an underscore-separated format, and converts it into a human-readable label
 * by replacing underscores with spaces and capitalizing the first letter of each word.
 *
 * @param {string} type - The credential type identifier to be formatted.
 * @returns {string} The formatted label with spaces and proper capitalization.
 */
export const credentialTypeToLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
}


export const dataTypeToIcon = (type: string) => {
    switch (type) {
        case 'boolean': return 'binary';
        case 'integer': return 'hash';
        case 'array': return 'brackets';
        case 'object': return 'braces';
        case 'string': return 'a-large-small';
        default: return 'braces';
    }
}

/**
 * Converts a string (kebab-case, snake_case, or camelCase) to a human-readable label.
 * Capitalizes the first letters of each word.
 * @returns The human-readable label.
 * @param input
 */
export const lowerKebabCaseToLabel = (input: string) => {
    if (!input) return input;

    // Replace underscores and hyphens with spaces
    // Then add space before capital letters (camelCase)
    const result = input
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2');

    // Capitalize the first letter of each word
    return result
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Converts a number to a string with double precision and an SI suffix (k, M, G, etc.)
 * @param value The number to format
 * @returns Formatted string
 */
export const formatDoublePrecisionWithSuffix = (value: number): string => {
    if (value === 0) return '0';
    if (isNaN(value)) return 'NaN';

    const suffixes = ['', 'k', 'M', 'G', 'T', 'P', 'E'];
    const tier = Math.floor(Math.log10(Math.abs(value)) / 3);

    if (tier <= 0) return value.toFixed(2).replace(/\.?0+$/, '');

    const suffix = suffixes[tier] || `e${tier * 3}`;
    const scale = Math.pow(10, tier * 3);
    const scaled = value / scale;

    return scaled.toFixed(2).replace(/\.?0+$/, '') + suffix;
};

/**
 * Validates if a string is a valid GUID.
 * @param guid - The string to validate.
 * @returns True if the string is a valid GUID, false otherwise.
 */
export const isValidGuid = (guid: string) => {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
};
