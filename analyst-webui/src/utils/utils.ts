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
 * Converts a permission to a human-readable label.
 * @param permission - The permission to convert.
 * @returns The human-readable label for the permission.
 */
export const permissionToLabel = (permission: string) => {
    switch (permission) {
        case 'PERM_USER_READ':
            return i18n.t('lbl_permission_user_read', 'View user accounts and their roles');
        case 'PERM_USER_WRITE':
            return i18n.t('lbl_permission_user_write', 'Create, modify, or deactivate users');
        case 'PERM_ROLE_READ':
            return i18n.t('lbl_permission_role_read', 'View roles and their permission sets');
        case 'PERM_ROLE_WRITE':
            return i18n.t('lbl_permission_role_write', 'Create or edit custom roles');
        case 'PERM_TEAM_READ':
            return i18n.t('lbl_permission_team_read', 'View teams, members and RACI matrices');
        case 'PERM_TEAM_WRITE':
            return i18n.t('lbl_permission_team_write', 'Manage teams, members and RACI overrides');
        case 'PERM_PIPELINE_READ':
            return i18n.t('lbl_permission_pipeline_read', 'View support pipeline configurations');
        case 'PERM_PIPELINE_WRITE':
            return i18n.t('lbl_permission_pipeline_write', 'Create or modify support pipelines');
        case 'PERM_ENVIRONMENT_READ':
            return i18n.t('lbl_permission_environment_read', 'View environment definitions and status');
        case 'PERM_ENVIRONMENT_WRITE':
            return i18n.t('lbl_permission_environment_write', 'Create or modify environment definitions');
        case 'PERM_DEPLOYMENT_READ':
            return i18n.t('lbl_permission_deployment_read', 'View deployment history and status');
        case 'PERM_DEPLOYMENT_EXECUTE':
            return i18n.t('lbl_permission_deployment_execute', 'Trigger new deployments');
        case 'PERM_DEPLOYMENT_WRITE':
            return i18n.t('lbl_permission_deployment_write', 'Manage deployment configurations');
        case 'PERM_SUPPORT_READ':
            return i18n.t('lbl_permission_support_read', 'View support conversations and tasks');
        case 'PERM_SUPPORT_WRITE':
            return i18n.t('lbl_permission_support_write', 'Manage support conversations and tasks');
        case 'PERM_KEYRING_READ':
            return i18n.t('lbl_permission_keyring_read', 'View credentials with masked payloads');
        case 'PERM_KEYRING_WRITE':
            return i18n.t('lbl_permission_keyring_write', 'Create, update, delete and test credentials');
        case 'PERM_NOTIFICATION_READ':
            return i18n.t('lbl_permission_notification_read', 'View escalations and delivery history');
        case 'PERM_NOTIFICATION_WRITE':
            return i18n.t('lbl_permission_notification_write', 'Acknowledge escalations and send test messages');
        case 'PERM_AUDIT_READ':
            return i18n.t('lbl_permission_audit_read', 'Access the system audit logs');
        case 'PERM_AUDIT_MANAGE':
            return i18n.t('lbl_permission_audit_manage', 'Manage and remove system audit log entries');
        case 'PERM_BACKUP_READ':
            return i18n.t('lbl_permission_backup_read', 'View backup history and create backups');
        case 'PERM_BACKUP_WRITE':
            return i18n.t('lbl_permission_backup_write', 'Restore data from backups');
        default:
            return permission;
    }
};


/**
 * Returns an icon path based on the credential type.
 * @param type - The credential type.
 * @returns The icon path for the credential type.
 */
export const credentialToIcon = (type: string) => {
    switch (type) {
        case 'AZURE_ARM':
            return '/assets/azure/ARM.svg';
        case 'AZURE_GRAPH_API':
            return '/assets/azure/Graph-Explorer.svg';
        case 'GITHUB':
            return '/assets/generics/github-color.svg';
        case 'BITBUCKET':
            return '/assets/generics/Bitbucket.svg';
        case 'SMTP':
            return '/assets/generics/SMTP.svg';
        case 'REST_WEBHOOK':
            return '/assets/generics/REST-Webhook.svg';
        case 'ANTHROPIC_API':
            return '/assets/generics/claude.svg';
        case 'AZURE_AI_FOUNDRY_API':
            return '/assets/azure/Azure-AI-Studio.svg';
        case 'LOCAL_API':
            return '/assets/generics/local-ai.svg';
        default:
            return '/assets/generics/unknown.svg';
    }
}

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
