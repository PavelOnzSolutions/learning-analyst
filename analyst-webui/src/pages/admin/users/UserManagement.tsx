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
import { Plus, RefreshCw, Shield, Trash2, Users } from 'lucide-react';
import PageHeader from '../../../components/layout/PageHeader';
import { ToolbarAction, useToolbar } from '../../../context/ToolbarContext';
import { usePageTitle } from '../../../context/PageTitleContext';
import { fetchWithAuth } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { IUserAccount } from '../../../models/user-account.model';
import UserProfile from '../../profile/UserProfile';
import Avatar from "react-avatar";

const ROLES = ['ADMIN', 'USER'] as const;

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
    const { showToast } = useToast();
    const { isAdmin } = useAuth();
    const queryClient = useQueryClient();
    usePageTitle('User Management');

    const [editRolesOpen, setEditRolesOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUserAccount | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('USER');
    const [profileModalUser, setProfileModalUser] = useState<IUserAccount | null>(null);

    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });

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
            showToast('User updated successfully', 'success');
            setEditRolesOpen(false);
            setSelectedUser(null);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => {
            showToast('Failed to update user', 'error');
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
            showToast('User disabled successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => {
            showToast('Failed to disable user', 'error');
        },
    });

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<string>('USER');

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
                throw new Error(errorText || 'Failed to create user');
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
            showToast('User created successfully', 'success');
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

    const roleColor = (role: string): 'red' | 'teal' | 'gray' => {
        return role === 'ADMIN' ? 'red' : role === 'USER' ? 'teal' : 'gray';
    };

    useToolbar([
        ...(isAdmin ? [{
            id: 'new',
            label: 'New User',
            icon: Plus,
            variant: 'solid',
            onClick: () => setIsCreateDialogOpen(true),
        } as ToolbarAction] : []),
        { id: 'refresh', label: 'Refresh', icon: RefreshCw, onClick: () => refetch() },
    ]);

    return (
        <Card size="4" className="w-full shadow-lg">
            <PageHeader icon={Users} title="User Management" description="Manage users and their roles" />

            {isLoading && (
                <div className="mb-4">
                    <Progress />
                </div>
            )}

            <Table.Root variant="surface">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                        {isAdmin && <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>}
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
                                    <Avatar src={user.avatarUrl ?? undefined} name={user.displayName || user.username} size="32" round={true} />
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
                                <Badge color={roleColor(user.role)} variant="soft">{user.role}</Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge color={user.enabled ? 'green' : 'gray'}>
                                    {user.enabled ? 'Active' : 'Disabled'}
                                </Badge>
                            </Table.Cell>
                            {isAdmin && (
                                <Table.Cell>
                                    <Flex gap="2">
                                        <Button size="1" variant="soft" onClick={(e) => { e.stopPropagation(); openEditRoleDialog(user); }}>
                                            <Shield size={14} /> Role
                                        </Button>
                                        {user.enabled && (
                                            <Button size="1" variant="soft" color="orange"
                                                onClick={(e) => { e.stopPropagation(); disableUserMutation.mutate(user.id); }}
                                                loading={disableUserMutation.isPending}>
                                                <Trash2 size={14} /> Disable
                                            </Button>
                                        )}
                                    </Flex>
                                </Table.Cell>
                            )}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

            <Dialog.Root open={editRolesOpen} onOpenChange={setEditRolesOpen}>
                <Dialog.Content style={{ maxWidth: 400 }}>
                    <Dialog.Title>Edit Role for {selectedUser?.username || selectedUser?.email}</Dialog.Title>
                    <Dialog.Description size="2" mb="4">Select a role for this user.</Dialog.Description>

                    <Box>
                        <Select.Root value={selectedRole} onValueChange={setSelectedRole}>
                            <Select.Trigger className="w-full" />
                            <Select.Content>
                                {ROLES.map(role => (
                                    <Select.Item key={role} value={role}>{role}</Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Box>

                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">Cancel</Button>
                        </Dialog.Close>
                        <Button onClick={handleUpdateRole} loading={updateUserMutation.isPending} color="green">Save</Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <Dialog.Content style={{ maxWidth: 450 }}>
                    <Dialog.Title>New User</Dialog.Title>
                    <Dialog.Description size="2" mb="4">Enter details for the new user.</Dialog.Description>

                    <Flex direction="column" gap="3">
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Email *</Text>
                            <TextField.Root type="email" placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Username *</Text>
                            <TextField.Root placeholder="Enter username (min 3 chars)" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Display Name</Text>
                            <TextField.Root placeholder="Optional display name" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Password *</Text>
                            <TextField.Root type="password" placeholder="Min 8 characters" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
                        </label>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">Role *</Text>
                            <Select.Root value={newUserRole} onValueChange={setNewUserRole}>
                                <Select.Trigger className="w-full" />
                                <Select.Content>
                                    {ROLES.map(role => (
                                        <Select.Item key={role} value={role}>{role}</Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        </Box>
                    </Flex>

                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">Cancel</Button>
                        </Dialog.Close>
                        <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}>Create</Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root open={!!profileModalUser} onOpenChange={(open) => !open && setProfileModalUser(null)}>
                <Dialog.Content style={{ maxWidth: 800 }}>
                    <Dialog.Title>Profile — {profileModalUser?.username || profileModalUser?.email}</Dialog.Title>
                    {profileModalUser && <UserProfile userId={profileModalUser.id} />}
                    <Flex gap="3" mt="4" justify="end">
                        <Button variant="soft" color="gray" onClick={() => setProfileModalUser(null)}>Close</Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </Card>
    );
};

export default UserManagement;
