import React, { useState } from 'react';
import {
    Home,
    LogOut,
    ChevronDown,
    ChevronRight,
    Users,
    Key,
    Activity,
    Globe,
    HelpingHand,
    HelpCircle,
    ArrowBigLeft,
    LifeBuoy,
    BadgeInfo,
    DatabaseBackup,
    ShieldUser, Bot, Cpu, Braces, Cog, FileBracesCorner, Play, History, BookOpen, KeyRound, BookUser,
    Workflow, AlertTriangle, Layers, Settings2, ChartNetwork, BrainCog, Brain, FingerprintPattern, Plug,
    FlaskRound, CloudCog
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../context/AuthContext.tsx';
import { Button, Dialog, Flex } from '@radix-ui/themes';

interface SidebarProps {
    isOpen: boolean;
    closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
    const { t } = useTranslation();
    const { logout, user } = useAuth();
    const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    const toggleExpand = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
        );
    };

    const handleLogout = () => {
        setLogoutDialogOpen(true);
    };

    const confirmLogout = () => {
        closeSidebar();
        logout();
    };

    const navItems = [
        { icon: Home, label: t('mit_home', 'Home'), path: '/' },
        { icon: Play, label: t('mit_tasks', 'Tasks'), path: '/tasks' },
        { icon: BookOpen, label: t('nav_knowledge', 'Knowledge Base'), path: '/knowledge' },
        { icon: Bot, label: t('mit_sandbox', 'Assistant Sandbox'), path: '/sandbox'},

        {
            icon: Brain,
            label: t('mit_sre', 'Auto SRE'),
            children: [
                {icon: ChartNetwork, label: t('mit_dashboard', 'Dashboard'), path: '/autosre/dashboard'},
                {icon: FlaskRound, label: t('mit_lab', 'SRE Lab'), path: '/autosre/lab'},
                {icon: BrainCog, label: t('mit_rules', 'SRE Rules'), path: '/autosre/rules'},
                {icon: CloudCog, label: t('mit_configuration', 'Configuration'), path: '/autosre/configuration'},
            ]
        },
        {
            icon: BookUser,
            label: t('mit_operations', 'Operations'),
            path: '/operations',
            children: [
                { icon: Users, label: t('mit_teams', 'Teams'), path: '/operations/teams' },
                { icon: Workflow, label: t('mit_pipelines', 'Pipelines'), path: '/operations/pipelines' },
                { icon: Layers, label: t('mit_environments', 'Environments'), path: '/operations/environments' },
                { icon: AlertTriangle, label: t('mit_escalations', 'Escalations'), path: '/operations/escalations' },
            ]
        },
        {
            icon: Cog,
            label: t('mit_administration', 'Administration'),
            path: '/admin',
            children: [
                { icon: History, label: t('mit_conversation_history', 'Conversation History'), path: '/admin/conversations' },
                { icon: Key, label: t('mit_keyring', 'Keyring'), path: '/admin/keyring' },
                { icon: Settings2, label: t('mit_configuration', 'Configuration'), path: '/admin/configuration' },
                { icon: Users, label: t('mit_users', 'Users'), path: '/admin/users' },
                { icon: ShieldUser, label: t('mit_roles', 'Roles'), path: '/admin/roles' },
                { icon: FingerprintPattern, label: t('mit_api_tokens', 'API Tokens'), path: '/admin/api-tokens' },
                { icon: FileBracesCorner, label: t('mit_api_docs', 'API Docs'), path: '/admin/api-docs' },
                { icon: Activity, label: t('mit_audit_log', 'Audit Log'), path: '/admin/audit-log' },
                { icon: Globe, label: t('mit_localization', 'Localization'), path: '/admin/localization' },
                { icon: DatabaseBackup, label: t('mit_backup_restore', 'Backup & Restore'), path: '/admin/backup' },
                { icon: Cpu, label: t('mit_diagnostics', 'Logs & Metrics'), path: '/admin/metrics' },
            ]
        },
        {
            icon: HelpCircle,
            label: t('mit_documentation', 'Help'),
            path: '/documentation',
            children: [
                { icon: HelpingHand, label: t('mit_quick_start', 'Quick Start'), path: '/documentation/quick-start' },
                { icon: HelpingHand, label: t('mit_core_concepts', 'Core Concepts'), path: '/documentation/core-concepts' },
                { icon: Home, label: t('mit_dashboard', 'Dashboard'), path: '/documentation/dashboard' },
                { icon: Play, label: t('mit_tasks', 'Tasks'), path: '/documentation/tasks' },
                { icon: BookOpen, label: t('nav_knowledge', 'Knowledge Base'), path: '/documentation/knowledge-base' },
                { icon: Bot, label: t('mit_assistant', 'Assistant'), path: '/documentation/assistant' },
                { icon: Workflow, label: t('mit_support_pipeline', 'Support Pipeline'), path: '/documentation/support-pipeline' },
                { icon: Brain, label: t('mit_autosre_doc', 'Auto SRE'), path: '/documentation/autosre' },
                { icon: BookUser, label: t('mit_operations_doc', 'Operations'), path: '/documentation/operations' },
                { icon: KeyRound, label: t('mit_keyring', 'Keyring'), path: '/documentation/keyring' },
                { icon: Plug, label: t('mit_mcp_configuration', 'MCP Configuration'), path: '/documentation/mcp-configuration' },
                { icon: ShieldUser, label: t('mit_roles', 'Roles'), path: '/documentation/roles' },
                { icon: Users, label: t('mit_users', 'Users'), path: '/documentation/users' },
                { icon: Braces, label: t('mit_api_and_api_tokens', 'API & Tokens'), path: '/documentation/api-tokens' },
                { icon: LifeBuoy, label: t('mit_audit_log', 'Audit Log'), path: '/documentation/audit-log' },
                { icon: Globe, label: t('mit_localization', 'Localization'), path: '/documentation/localization' },
                { icon: DatabaseBackup, label: t('mit_backup_restore', 'Backup & Restore'), path: '/documentation/backup-restore' },
                { icon: BadgeInfo, label: t('mit_about', 'About'), path: '/documentation/about' },
            ]
        }
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 xl:hidden"
                    onClick={closeSidebar}
                />
            )}

            <aside className={`
        fixed xl:static inset-y-0 left-0 z-30
        w-72 bg-(--sidebar-glass-bg) backdrop-blur-[50px] border-r border-[var(--glass-border)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
        flex flex-col shadow-xl
      `}>
                <div className="p-6 border-b border-[var(--glass-border)] xl:hidden">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-[var(--gray-12)] to-[var(--accent-11)] bg-clip-text text-transparent">{t('lbl_menu', 'Menu')}</h2>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <div key={item.path || item.label}>
                            {item.children ? (
                                <>
                                    <button
                                        onClick={() => toggleExpand(item.label)}
                                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors text-[var(--gray-11)] hover:bg-[var(--gray-3)]`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5 transition-all duration-1000 ease-linear" />
                                            <span>{item.label}</span>
                                        </div>
                                        {expandedItems.includes(item.label) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                    {expandedItems.includes(item.label) && (
                                        <div className="ml-4 space-y-1 mt-1 border-l border-[var(--gray-5)] pl-2">
                                            {item.children.map(child => {
                                                return (
                                                    <NavLink
                                                        key={child.path}
                                                        to={child.path}
                                                        className={({ isActive }) => `
                                                            flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
                                                            ${isActive
                                                                ? 'bg-[var(--accent-3)] text-[var(--accent-11)] font-medium'
                                                                : 'text-[var(--gray-11)] hover:bg-[var(--gray-3)]'
                                                            }
                                                        `}
                                                    >
                                                        <child.icon className="w-4 h-4" />
                                                        <span>{child.label}</span>
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                        ${isActive
                                            ? 'bg-[var(--accent-3)] text-[var(--accent-11)] font-medium'
                                            : 'text-[var(--gray-11)] hover:bg-[var(--gray-3)]'
                                        }
                                    `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </NavLink>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-[var(--gray-5)]">
                    <button
                        className="flex items-center gap-3 px-4 py-1 w-full rounded-lg text-[var(--red-11)] hover:bg-[var(--red-3)] transition-colors"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5" />
                        <span>{t('btn_sign_out', 'Sign Out')}</span>
                    </button>
                </div>

                <Dialog.Root open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                    <Dialog.Content style={{ maxWidth: 450 }}>
                        <Dialog.Title>{t('lbl_logging_out_user', 'Logging out user')} <span className="text-[var(--accent-10)]">{user?.username}</span></Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            {t('lbl_logout_confirmation', 'Are you sure you want to log out from this session?')}
                        </Dialog.Description>

                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray">
                                    <ArrowBigLeft className="w-5 h-5" />
                                    {t('btn_back', 'Back')}
                                </Button>
                            </Dialog.Close>
                            <Button variant="solid" color="red" onClick={confirmLogout}>
                                <LogOut className="w-5 h-5" />
                                {t('btn_logout', 'Logout')}
                            </Button>
                        </Flex>
                    </Dialog.Content>
                </Dialog.Root>

            </aside>
        </>
    );
};

export default Sidebar;
