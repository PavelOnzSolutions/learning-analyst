import { useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Card,
    Dialog,
    Flex,
    Progress,
    Select,
    Table,
    Text,
    TextField
} from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CircleHelp, Download, Plus, RefreshCw, Shield, Trash2, Users } from 'lucide-react';
import PageHeader from '../../../components/layout/PageHeader';
import { ToolbarAction, useToolbar } from '../../../context/ToolbarContext';
import { usePageTitle } from '../../../context/PageTitleContext';
import { fetchWithAuth } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { EUserOrigin, IUserAccount } from '../../../models/user-account.model';
import UserManagementHelp from '../../documentation/UserManagementHelp';
import { ImportUsersModal } from '../../../components/modals/ImportUsersModal';
import { DirectoryService } from '../../../services/DirectoryService';
import UserProfile from '../../profile/UserProfile';
import Avatar from "react-avatar";
import { IAuthority } from '../../../models/authority.model';
import {accentColors} from "../../../context/ThemeContext.tsx";

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
}

const fetchUsers = async (): Promise<IUserAccount[]> => {
    const response = await fetchWithAuth('/v1/users?size=200&sort=createdAt,desc');
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    const page: PageResponse<IUserAccount> = await response.json();
    return page.content;
};

const UserManagement = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { hasPermission } = useAuth();
    const queryClient = useQueryClient();
    usePageTitle(t('ptitle_users', 'User Management'));

    const [editRolesOpen, setEditRolesOpen] = useState(false);
    const [helpDialogOpen, setHelpDialogOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUserAccount | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('USER');
    const [profileModalUser, setProfileModalUser] = useState<IUserAccount | null>(null);

    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });

    const { data: entraConfig } = useQuery({
        queryKey: ['entra-config'],
        queryFn: DirectoryService.getConfig,
        staleTime: 5 * 60 * 1000,
    });

    const { data: authorities } = useQuery<IAuthority[]>({
        queryKey: ['authorities'],
        queryFn: async () => {
            const response = await fetchWithAuth('/v1/authorities');
            if (!response.ok) throw new Error('Failed to fetch authorities');
            return response.json();
        },
    });
    const roleNames = authorities?.map(a => a.name) ?? [];

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, role, enabled }: { id: string; role?: string; enabled?: boolean }) => {
            const body: Record<string, unknown> = {};
            if (role !== undefined) body.role = role;
            if (enabled !== undefined) body.enabled = enabled;
            const response = await fetchWithAuth(`/v1/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error('Failed to update user: ' + (await response.text()));
            }
            return response.json();
        },
        onSuccess: () => {
            showToast(t('msg_user_updated', 'User updated successfully'), 'success');
            setEditRolesOpen(false);
            setSelectedUser(null);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => {
            showToast(t('msg_user_update_failed', 'Failed to update user'), 'error');
        },
    });

    const disableUserMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetchWithAuth(`/v1/users/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Failed to disable user: ' + (await response.text()));
            }
        },
        onSuccess: () => {
            showToast(t('msg_user_disabled', 'User disabled successfully'), 'success');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => {
            showToast(t('msg_user_disable_failed', 'Failed to disable user'), 'error');
        },
    });

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('USER');

    const createMutation = useMutation({
        mutationFn: async () => {
            const response = await fetchWithAuth('/v1/users', {
                method: 'POST',
                body: JSON.stringify({
                    email: newEmail,
                    username: newUsername,
                    displayName: newDisplayName || undefined,
                    password: newUserPassword,
                    role: newUserRole,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || t('msg_create_failed', 'Failed to create user'));
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateDialogOpen(false);
            setNewEmail('');
            setNewUsername('');
            setNewDisplayName('');
            setNewUserPassword('');
            setNewUserRole('USER');
            showToast(t('msg_user_created', 'User created successfully'), 'success');
        },
        onError: (error: Error) => {
            showToast(error.message, 'error');
        },
    });

    const openEditRoleDialog = (user: IUserAccount) => {
        setSelectedUser(user);
        setSelectedRole(user.role);
        setEditRolesOpen(true);
    };

    const openProfileModal = (user: IUserAccount) => {
        setProfileModalUser(user);
    };

    const handleUpdateRole = () => {
        if (selectedUser) {
            updateUserMutation.mutate({ id: selectedUser.id, role: selectedRole });
        }
    };

    const originDisplay = (origin: EUserOrigin): { label: string; color: any } => {
        switch (origin) {
            case EUserOrigin.LOCAL: return { label: t('lbl_user_local', 'Local'), color: 'violet' };
            case EUserOrigin.OAUTH2: return { label: t('lbl_user_oauth', 'OAuth2'), color: 'gold' };
            case EUserOrigin.SYNCHRONIZED: return { label: t('lbl_user_synchronized', 'Directory'), color: 'cyan' };
            default: return { label: t('lbl_unknown', 'Unknown'), color: 'gray' };
        }
    };

    const roleColor = (role: string): any => {
        switch (role) {
            case 'ADMIN': return 'red';
            case 'USER': return 'teal';
            case 'VIEWER': return 'indigo';
            default: return accentColors[Math.floor(Math.random() * accentColors.length)];
        }
    };

    useToolbar([
        ...(hasPermission('PERM_USER_WRITE') ? [{
            id: 'new',
            label: t('btn_new_user', 'New User'),
            icon: Plus,
            variant: 'solid',
            onClick: () => setIsCreateDialogOpen(true),
        } as ToolbarAction] : []),
        ...(entraConfig?.enabled && hasPermission('PERM_USER_WRITE') ? [{
            id: 'import-ad',
            label: t('btn_import_from_ad', 'Import from AD'),
            icon: Download,
            variant: 'solid',
            onClick: () => setImportModalOpen(true),
        } as ToolbarAction] : []),
        { id: 'refresh', label: t('btn_refresh', 'Refresh'), icon: RefreshCw, onClick: () => refetch() },
        { id: 'help', label: t('btn_help', 'Help'), icon: CircleHelp, color: 'sky', onClick: () => setHelpDialogOpen(true) },
    ]);

    return (
        <Card size="4" className="w-full shadow-lg">
            <PageHeader
                icon={Users}
                title={t('lbl_user_mgmt', 'User Management')}
                description={t('lbl_user_mgmt_desc', 'Manage users and their roles')}
            />

            {isLoading && (
                <div className="mb-4">
                    <Progress />
                </div>
            )}

            <Table.Root variant="surface">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeaderCell>{t('thead_user', 'User')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('thead_email', 'Email')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('thead_user_origin', 'Origin')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('thead_role', 'Role')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('thead_status', 'Status')}</Table.ColumnHeaderCell>
                        {hasPermission('PERM_USER_WRITE') && (
                            <Table.ColumnHeaderCell>{t('thead_actions', 'Actions')}</Table.ColumnHeaderCell>
                        )}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {users?.map((user) => (
                        <Table.Row
                            key={user.id}
                            className="hover:bg-(--accent-2)"
                            style={{ cursor: 'pointer' }}
                            onClick={() => openProfileModal(user)}
                        >
                            <Table.Cell>
                                <Flex align="center" gap="3">
                                    <Avatar
                                        src={user.avatarUrl ?? undefined}
                                        name={user.displayName || user.username || undefined}
                                        size="32"
                                        round={true}
                                    />
                                    <Flex direction="column">
                                        <Text weight="bold">{user.username || user.displayName || '—'}</Text>
                                        {user.displayName && user.username && (
                                            <Text size="1" color="gray">{user.displayName}</Text>
                                        )}
                                    </Flex>
                                </Flex>
                            </Table.Cell>
                            <Table.Cell>
                                <Text size="2" color="gray">{user.email}</Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge color={originDisplay(user.origin).color}>
                                    {originDisplay(user.origin).label}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge color={roleColor(user.role)} variant="soft">
                                    {user.role}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge color={user.enabled ? 'green' : 'gray'}>
                                    {user.enabled ? t('lbl_active', 'Active') : t('lbl_disabled', 'Disabled')}
                                </Badge>
                            </Table.Cell>
                            {hasPermission('PERM_USER_WRITE') && (
                                <Table.Cell>
                                    <Flex gap="2">
                                        <Button size="1" variant="soft" onClick={(e) => {
                                            e.stopPropagation();
                                            openEditRoleDialog(user);
                                        }}>
                                            <Shield size={14} />
                                            {t('btn_role', 'Role')}
                                        </Button>
                                        {user.enabled && (
                                            <Button size="1" variant="soft" color="orange"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    disableUserMutation.mutate(user.id);
                                                }}
                                                loading={disableUserMutation.isPending}>
                                                <Trash2 size={14} />
                                                {t('btn_disable', 'Disable')}
                                            </Button>
                                        )}
                                    </Flex>
                                </Table.Cell>
                            )}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

            {/* Edit Role Dialog */}
            <Dialog.Root open={editRolesOpen} onOpenChange={setEditRolesOpen}>
                <Dialog.Content style={{ maxWidth: 400 }}>
                    <Dialog.Title>
                        {t('lbl_edit_role_for', 'Edit Role for')} {selectedUser?.username || selectedUser?.email}
                    </Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        {t('lbl_select_user_role', 'Select a role for this user.')}
                    </Dialog.Description>

                    <Box>
                        <Select.Root value={selectedRole} onValueChange={setSelectedRole}>
                            <Select.Trigger className="w-full" />
                            <Select.Content>
                                {roleNames.map(role => (
                                    <Select.Item key={role} value={role}>{role}</Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Box>

                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">{t('btn_cancel', 'Cancel')}</Button>
                        </Dialog.Close>
                        <Button onClick={handleUpdateRole} loading={updateUserMutation.isPending} color="green">
                            {t('btn_save', 'Save')}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            {/* Create User Dialog */}
            <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <Dialog.Content style={{ maxWidth: 450 }}>
                    <Dialog.Title>{t('lbl_new_user', 'New User')}</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        {t('lbl_enter_user_details', 'Enter details for the new user.')}
                    </Dialog.Description>

                    <Flex direction="column" gap="3">
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">{t('lbl_email', 'Email')} *</Text>
                            <TextField.Root
                                type="email"
                                placeholder="user@example.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">{t('lbl_username', 'Username')} *</Text>
                            <TextField.Root
                                placeholder={t('ph_username', 'Enter username (min 3 chars)')}
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">{t('lbl_display_name', 'Display Name')}</Text>
                            <TextField.Root
                                placeholder={t('ph_display_name', 'Optional display name')}
                                value={newDisplayName}
                                onChange={(e) => setNewDisplayName(e.target.value)}
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">{t('lbl_password', 'Password')} *</Text>
                            <TextField.Root
                                type="password"
                                placeholder={t('ph_password', 'Min 8 characters')}
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                            />
                        </label>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">{t('lbl_role', 'Role')} *</Text>
                            <Select.Root value={newUserRole} onValueChange={setNewUserRole}>
                                <Select.Trigger className="w-full" />
                                <Select.Content>
                                    {roleNames.map(role => (
                                        <Select.Item key={role} value={role}>{role}</Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        </Box>
                    </Flex>

                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">{t('btn_cancel', 'Cancel')}</Button>
                        </Dialog.Close>
                        <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
                            {t('btn_create', 'Create')}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            {/* Help Dialog */}
            <Dialog.Root open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
                <Dialog.Content style={{ maxWidth: 800 }}>
                    <UserManagementHelp hideTitle />
                    <Flex gap="3" mt="4" justify="end">
                        <Button variant="soft" color="gray" onClick={() => setHelpDialogOpen(false)}>
                            {t('btn_close', 'Close')}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            {/* User Profile Dialog */}
            <Dialog.Root open={!!profileModalUser} onOpenChange={(open) => !open && setProfileModalUser(null)}>
                <Dialog.Content style={{ maxWidth: 800 }}>
                    <Dialog.Title>
                        {t('lbl_user_profile_for', 'Profile')} — {profileModalUser?.username || profileModalUser?.email}
                    </Dialog.Title>
                    {profileModalUser && <UserProfile userId={profileModalUser.id} />}
                    <Flex gap="3" mt="4" justify="end">
                        <Button variant="soft" color="gray" onClick={() => setProfileModalUser(null)}>
                            {t('btn_close', 'Close')}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            <ImportUsersModal
                open={importModalOpen}
                onOpenChange={setImportModalOpen}
                onImported={refetch}
            />
        </Card>
    );
};

export default UserManagement;
