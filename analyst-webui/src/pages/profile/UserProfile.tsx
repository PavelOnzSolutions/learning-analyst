import {useEffect, useMemo, useState} from 'react';
import {
    Badge,
    Button,
    Card,
    Flex,
    Separator,
    Text,
    TextField,
    Box,
    Heading,
    Grid,
    Table,
    Code,
    Tooltip,
} from '@radix-ui/themes';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {usePageTitle} from '../../context/PageTitleContext';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {fetchWithAuth} from '../../utils/api';
import {useToast} from '../../context/ToastContext';
import {
    ArrowBigLeft,
    Lock,
    UserCircle,
    Pencil,
    KeyRound,
    Activity,
    ShieldCheck,
    Clock,
} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {UserInfo} from '../../models/auth.model';
import Avatar from "react-avatar";

interface TokenListItem {
    id: string;
    userId: string;
    description: string | null;
    issuedAt: string;
    expiresAt: string;
    revoked: boolean;
}

interface CompactAuditLog {
    id: string;
    type: string;
    severity: string;
    collectionName: string | null;
    operation: string | null;
    entityId: string | null;
    entityClass: string | null;
    timestamp: string;
    userLogin: string | null;
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
}

const fetchUserProfile = async (userId?: string): Promise<UserInfo> => {
    const response = await fetchWithAuth(userId ? `/v1/users/${userId}` : '/v1/users/me');
    if (!response.ok) {
        throw new Error('Failed to load profile');
    }
    return response.json();
};

const fetchMyTokens = async (): Promise<TokenListItem[]> => {
    const response = await fetchWithAuth('/v1/tokens');
    if (!response.ok) {
        throw new Error('Failed to load tokens');
    }
    return response.json();
};

const fetchMyAuditLogs = async (username: string): Promise<PageResponse<CompactAuditLog>> => {
    const response = await fetchWithAuth(
        `/audit-logs?user=${encodeURIComponent(username)}&size=5&sort=timestamp,desc`
    );
    if (!response.ok) {
        throw new Error('Failed to load audit logs');
    }
    return response.json();
};

const formatInstant = (value: string | null | undefined, locale: string) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString(locale);
    } catch {
        return value;
    }
};

const daysBetween = (from: Date, to: Date) =>
    Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));

interface UserProfileProps {
    /** When set, shows another user's profile (admin view) instead of the logged-in user's own profile. */
    userId?: string;
}

const UserProfile = ({ userId }: UserProfileProps = {}) => {
    const { t, i18n } = useTranslation();
    const { user, hasPermission, tokenExpiration, tokenIssuedAt } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isSelf = !userId;

    // Only the standalone /profile page owns the browser tab title. Skip it when embedded
    // (e.g. shown inside an admin modal for another user's profile).
    if (isSelf) {
        usePageTitle(t('ptitle_profile', 'User Profile'));
    }

    const locale = i18n.language || 'en';

    const { data: profile, isLoading } = useQuery({
        queryKey: ['users', userId ?? 'me'],
        queryFn: () => fetchUserProfile(userId),
    });

    const { data: tokens } = useQuery({
        queryKey: ['tokens', 'me'],
        queryFn: fetchMyTokens,
        enabled: isSelf,
    });

    const canReadAudit = hasPermission('PERM_AUDIT_READ');
    const { data: auditLogs } = useQuery({
        queryKey: ['audit-logs', 'me', profile?.username],
        queryFn: () => fetchMyAuditLogs(profile!.username!),
        enabled: canReadAudit && !!profile?.username,
    });

    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.displayName ?? '');
            setAvatarUrl(profile.avatarUrl ?? '');
        }
    }, [profile]);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const updateProfileMutation = useMutation({
        mutationFn: async () => {
            const response = await fetchWithAuth('/v1/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    displayName: displayName || null,
                    avatarUrl: avatarUrl || null,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update profile');
            }
            return response.json() as Promise<UserInfo>;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['users', 'me'], data);
            showToast(t('msg_profile_updated', 'Profile updated successfully'), 'success');
        },
        onError: (error: Error) => {
            showToast(error.message || t('msg_profile_update_failed', 'Failed to update profile'), 'error');
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            const response = await fetchWithAuth('/v1/users/me/password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to change password');
            }
        },
        onSuccess: () => {
            showToast(t('msg_password_changed', 'Password changed successfully'), 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: Error) => {
            showToast(error.message || t('msg_password_change_failed', 'Failed to change password'), 'error');
        },
    });

    const handleUpdateProfile = () => updateProfileMutation.mutate();

    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            showToast(t('msg_passwords_do_not_match', 'Passwords do not match'), 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast(t('msg_password_too_short', 'New password must be at least 8 characters'), 'error');
            return;
        }
        if (!currentPassword) {
            showToast(t('msg_enter_current_password', 'Please enter your current password'), 'error');
            return;
        }
        changePasswordMutation.mutate();
    };

    const tokenStats = useMemo(() => {
        const now = Date.now();
        const total = tokens?.length ?? 0;
        const revoked = tokens?.filter((tok) => tok.revoked).length ?? 0;
        const expired = tokens?.filter((tok) => !tok.revoked && new Date(tok.expiresAt).getTime() <= now).length ?? 0;
        const active = total - revoked - expired;
        return { total, active, revoked, expired };
    }, [tokens]);

    const accountAgeDays = useMemo(() => {
        if (!profile?.createdAt) return null;
        return daysBetween(new Date(profile.createdAt), new Date());
    }, [profile?.createdAt]);

    const tokenRemainingSeconds = useMemo(() => {
        if (!tokenExpiration) return null;
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, tokenExpiration - now);
    }, [tokenExpiration]);

    const formatDuration = (seconds: number | null) => {
        if (seconds == null) return '—';
        if (seconds <= 0) return t('lbl_expired', 'Expired');
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    if (!user || isLoading || !profile) {
        return <Text>{t('lbl_loading', 'Loading...')}</Text>;
    }

    const handleBack = () => navigate(-1);

    const isLocalAccount = profile.origin === 'LOCAL';
    const displayLabel = profile.displayName || profile.username || profile.email;
    const profileDirty =
        (displayName || '') !== (profile.displayName ?? '') ||
        (avatarUrl || '') !== (profile.avatarUrl ?? '');

    return (
        <Box p={isSelf ? '4' : '0'}>
            <Flex direction="column" gap="6" maxWidth="900px" mx="auto">
                {isSelf && (
                    <header>
                        <Flex justify="between" align="center" mb="2">
                            <Heading size="6">
                                <Flex align="center" gap="2">
                                    <UserCircle size={32} color="var(--accent-11)"/>
                                    <span
                                        className="bg-linear-to-l from-(--gray-12) to-(--accent-11) bg-clip-text text-transparent">
                                        {t('head_user_profile', 'User Profile')}
                                    </span>
                                </Flex>
                            </Heading>
                            <Button onClick={handleBack} variant="soft" color="amber">
                                <ArrowBigLeft size={16} /> {t('btn_back', 'Back')}
                            </Button>
                        </Flex>
                        <Text color="gray" size="2">
                            {t('sub_user_profile', 'View and manage your account details.')}
                        </Text>
                    </header>
                )}

                <Card size="3">
                    <Flex direction="column" gap="4">
                        <Flex direction="row" gap="2" align="center">
                            <UserCircle size={14} className="text-(--accent-9)" />
                            <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">
                                {t('title_profile_info', 'Account Information')}
                            </Text>
                        </Flex>

                        <Flex gap="4" align="center" wrap="wrap">
                            <Avatar
                                src={(isSelf ? user.imageUrl : profile.avatarUrl) ?? undefined}
                                name={(isSelf ? user.username : profile.username) ?? 'User'}
                                size="64"
                                round={true}
                            />
                            <Flex direction="column" gap="1">
                                <Text size="6" weight="bold">{displayLabel}</Text>
                                <Text size="2" color="gray">{profile.email}</Text>
                                {profile.username && profile.username !== displayLabel && (
                                    <Text size="1" color="gray">@{profile.username}</Text>
                                )}
                                <Text size="1" color="gray">ID: <Code size="1">{profile.id}</Code></Text>
                                <Flex gap="2" mt="2" wrap="wrap">
                                    <Badge color="blue" variant="soft">{profile.role}</Badge>
                                    <Badge color="gray" variant="soft">{profile.origin}</Badge>
                                    {!profile.enabled && (
                                        <Badge color="red" variant="soft">
                                            {t('lbl_disabled', 'Disabled')}
                                        </Badge>
                                    )}
                                </Flex>
                            </Flex>
                        </Flex>

                        <Separator size="4" />

                        <Grid columns={{ initial: '2', sm: isSelf ? '4' : '2' }} gap="4">
                            <Flex direction="column">
                                <Text size="1" color="gray">{t('lbl_member_since', 'Member since')}</Text>
                                <Text size="3" weight="bold">{formatInstant(profile.createdAt, locale)}</Text>
                            </Flex>
                            <Flex direction="column">
                                <Text size="1" color="gray">{t('lbl_account_age', 'Account age')}</Text>
                                <Text size="3" weight="bold">
                                    {accountAgeDays != null
                                        ? t('lbl_days_count', '{{count}} days', { count: accountAgeDays })
                                        : '—'}
                                </Text>
                            </Flex>
                            {isSelf && (
                                <>
                                    <Flex direction="column">
                                        <Text size="1" color="gray">{t('lbl_roles', 'Roles')}</Text>
                                        <Text size="3" weight="bold">{user.roles.length}</Text>
                                    </Flex>
                                    <Flex direction="column">
                                        <Text size="1" color="gray">{t('lbl_permissions', 'Permissions')}</Text>
                                        <Text size="3" weight="bold">{user.authorities.length}</Text>
                                    </Flex>
                                </>
                            )}
                        </Grid>
                    </Flex>
                </Card>

                {isSelf && (
                    <Card size="3">
                        <Flex direction="column" gap="4">
                            <Flex direction="row" gap="2" align="center">
                                <ShieldCheck size={14} className="text-(--accent-9)" />
                                <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">
                                    {t('title_session', 'Current Session')}
                                </Text>
                            </Flex>
                            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                                <Flex direction="column" gap="1">
                                    <Text size="1" color="gray">{t('lbl_token_issued_at', 'Token issued at')}</Text>
                                    <Text size="3" weight="bold">
                                        {tokenIssuedAt ? formatInstant(new Date(tokenIssuedAt * 1000).toISOString(), locale) : '—'}
                                    </Text>
                                </Flex>
                                <Flex direction="column" gap="1">
                                    <Text size="1" color="gray">{t('lbl_token_expires_at', 'Token expires at')}</Text>
                                    <Text size="3" weight="bold">
                                        {tokenExpiration ? formatInstant(new Date(tokenExpiration * 1000).toISOString(), locale) : '—'}
                                    </Text>
                                </Flex>
                                <Flex direction="column" gap="1">
                                    <Text size="1" color="gray">{t('lbl_time_remaining', 'Time remaining')}</Text>
                                    <Flex align="center" gap="2">
                                        <Clock size={14} color="var(--gray-10)" />
                                        <Text size="3" weight="bold">{formatDuration(tokenRemainingSeconds)}</Text>
                                    </Flex>
                                </Flex>
                                <Flex direction="column" gap="1">
                                    <Text size="1" color="gray">{t('lbl_active_roles', 'Active roles')}</Text>
                                    <Flex gap="1" wrap="wrap">
                                        {user.roles.length > 0
                                            ? user.roles.map((r) => (
                                                <Badge key={r} color="blue" variant="soft">{r.replace('ROLE_', '')}</Badge>
                                            ))
                                            : <Text size="2" color="gray">—</Text>}
                                    </Flex>
                                </Flex>
                            </Grid>
                        </Flex>
                    </Card>
                )}

                {isSelf && (
                    <Card size="3">
                        <Flex direction="column" gap="4">
                            <Flex direction="row" gap="2" align="center" justify="between">
                                <Flex gap="2" align="center">
                                    <KeyRound size={14} className="text-(--accent-9)" />
                                    <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">
                                        {t('title_api_tokens', 'API Tokens')}
                                    </Text>
                                </Flex>
                                <Button variant="soft" size="2" onClick={() => navigate('/admin/api-tokens')}>
                                    {t('btn_manage_tokens', 'Manage')}
                                </Button>
                            </Flex>
                            <Grid columns={{ initial: '2', sm: '4' }} gap="4">
                                <Flex direction="column">
                                    <Text size="1" color="gray">{t('lbl_total', 'Total')}</Text>
                                    <Text size="5" weight="bold">{tokenStats.total}</Text>
                                </Flex>
                                <Flex direction="column">
                                    <Text size="1" color="gray">{t('lbl_active', 'Active')}</Text>
                                    <Text size="5" weight="bold" color="green">{tokenStats.active}</Text>
                                </Flex>
                                <Flex direction="column">
                                    <Text size="1" color="gray">{t('lbl_revoked', 'Revoked')}</Text>
                                    <Text size="5" weight="bold" color="red">{tokenStats.revoked}</Text>
                                </Flex>
                                <Flex direction="column">
                                    <Text size="1" color="gray">{t('lbl_expired', 'Expired')}</Text>
                                    <Text size="5" weight="bold" color="amber">{tokenStats.expired}</Text>
                                </Flex>
                            </Grid>
                        </Flex>
                    </Card>
                )}

                {canReadAudit && (
                    <Card size="3">
                        <Flex direction="column" gap="4">
                            <Flex direction="row" gap="2" align="center" justify="between">
                                <Flex gap="2" align="center">
                                    <Activity size={14} className="text-(--accent-9)" />
                                    <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">
                                        {t('title_recent_activity', 'Recent Activity')}
                                    </Text>
                                </Flex>
                                <Badge color="gray" variant="soft">
                                    {t('lbl_total_events', '{{count}} total', { count: auditLogs?.totalElements ?? 0 })}
                                </Badge>
                            </Flex>
                            {auditLogs && auditLogs.content.length > 0 ? (
                                <Table.Root variant="surface">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeaderCell>{t('lbl_when', 'When')}</Table.ColumnHeaderCell>
                                            <Table.ColumnHeaderCell>{t('lbl_type', 'Type')}</Table.ColumnHeaderCell>
                                            <Table.ColumnHeaderCell>{t('lbl_operation', 'Operation')}</Table.ColumnHeaderCell>
                                            <Table.ColumnHeaderCell>{t('lbl_entity', 'Entity')}</Table.ColumnHeaderCell>
                                            <Table.ColumnHeaderCell>{t('lbl_severity', 'Severity')}</Table.ColumnHeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {auditLogs.content.map((log) => (
                                            <Table.Row key={log.id}>
                                                <Table.Cell>
                                                    <Tooltip content={log.timestamp}>
                                                        <Text size="1">{formatInstant(log.timestamp, locale)}</Text>
                                                    </Tooltip>
                                                </Table.Cell>
                                                <Table.Cell><Badge variant="soft">{log.type}</Badge></Table.Cell>
                                                <Table.Cell>{log.operation ?? '—'}</Table.Cell>
                                                <Table.Cell>
                                                    <Text size="1" color="gray">{log.entityClass ?? log.collectionName ?? '—'}</Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge
                                                        color={log.severity === 'ERROR' ? 'red' : log.severity === 'WARN' ? 'amber' : 'gray'}
                                                        variant="soft"
                                                    >
                                                        {log.severity}
                                                    </Badge>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            ) : (
                                <Text size="2" color="gray">{t('msg_no_recent_activity', 'No recent activity.')}</Text>
                            )}
                        </Flex>
                    </Card>
                )}

                {isSelf && (
                    <Card size="3">
                        <Flex direction="column" gap="4">
                            <Flex direction="row" gap="2" align="center">
                                <Pencil size={14} className="text-(--accent-9)" />
                                <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">
                                    {t('title_edit_profile', 'Edit Profile')}
                                </Text>
                            </Flex>

                            <Grid columns={{ initial: '1', sm: '2' }} gap="4" align="center">
                                <Box>
                                    <Text as="div" size="2" weight="bold">{t('lbl_display_name', 'Display Name')}</Text>
                                    <Text as="div" size="1" color="gray">{t('desc_display_name', 'Name shown across the app')}</Text>
                                </Box>
                                <TextField.Root
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder={t('ph_display_name', 'Enter display name')}
                                />

                                <Box>
                                    <Text as="div" size="2" weight="bold">{t('lbl_avatar_url', 'Avatar URL')}</Text>
                                    <Text as="div" size="1" color="gray">{t('desc_avatar_url', 'Link to your profile image')}</Text>
                                </Box>
                                <Flex gap="3" align="center">
                                    <TextField.Root
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        placeholder={t('ph_avatar_url', 'https://...')}
                                        style={{ flex: 1 }}
                                    />
                                    <Avatar
                                        src={user.imageUrl ?? undefined}
                                        name={user.username ?? 'User'}
                                        size="16"
                                        round={true}
                                    />
                                </Flex>
                            </Grid>

                            <Separator size="4" />

                            <Flex justify="end">
                                <Button
                                    onClick={handleUpdateProfile}
                                    disabled={updateProfileMutation.isPending || !profileDirty}
                                    size="3"
                                    variant="soft"
                                >
                                    {updateProfileMutation.isPending
                                        ? t('lbl_saving', 'Saving...')
                                        : t('btn_save_profile', 'Save Profile')}
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>
                )}

                {isSelf && isLocalAccount && (
                    <Card size="3">
                        <Flex direction="column" gap="4">
                            <Flex direction="row" gap="2" align="center">
                                <Lock size={14} className="text-(--accent-9)" />
                                <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">
                                    {t('title_change_password', 'Security')}
                                </Text>
                            </Flex>

                            <Grid columns={{ initial: '1', sm: '2' }} gap="4" align="center">
                                <Box>
                                    <Text as="div" size="2" weight="bold">{t('lbl_current_password', 'Current Password')}</Text>
                                    <Text as="div" size="1" color="gray">{t('desc_current_password', 'Enter your current password to verify identity')}</Text>
                                </Box>
                                <TextField.Root
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder={t('ph_current_password', 'Enter current password')}
                                />

                                <Box>
                                    <Text as="div" size="2" weight="bold">{t('lbl_new_password', 'New Password')}</Text>
                                    <Text as="div" size="1" color="gray">{t('desc_new_password', 'At least 8 characters')}</Text>
                                </Box>
                                <TextField.Root
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder={t('ph_new_password', 'Enter new password')}
                                />

                                <Box>
                                    <Text as="div" size="2" weight="bold">{t('lbl_confirm_password', 'Confirm Password')}</Text>
                                    <Text as="div" size="1" color="gray">{t('desc_confirm_password', 'Re-type your new password')}</Text>
                                </Box>
                                <TextField.Root
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('ph_confirm_password', 'Confirm new password')}
                                />
                            </Grid>

                            <Separator size="4" />

                            <Flex justify="end">
                                <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending} size="3" variant="soft">
                                    {changePasswordMutation.isPending ? t('lbl_saving', 'Saving...') : t('btn_change_password', 'Change Password')}
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>
                )}
            </Flex>
        </Box>
    );
};

export default UserProfile;
