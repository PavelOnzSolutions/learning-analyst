import {useEffect, useMemo, useState} from 'react';
import {
    Badge, Button, Card, Flex, Separator, Text, TextField, Box, Heading, Grid, Code,
} from '@radix-ui/themes';
import {useAuth} from '../../context/AuthContext';
import {usePageTitle} from '../../context/PageTitleContext';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {fetchWithAuth} from '../../utils/api';
import {useToast} from '../../context/ToastContext';
import {ArrowBigLeft, Lock, UserCircle, Pencil, KeyRound, ShieldCheck, Clock} from 'lucide-react';
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
    const { user, tokenExpiration, tokenIssuedAt } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isSelf = !userId;
    const locale = 'en';

    if (isSelf) {
        usePageTitle('User Profile');
    }

    const { data: profile, isLoading } = useQuery({
        queryKey: ['users', userId ?? 'me'],
        queryFn: () => fetchUserProfile(userId),
    });

    const { data: tokens } = useQuery({
        queryKey: ['tokens', 'me'],
        queryFn: fetchMyTokens,
        enabled: isSelf,
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
                body: JSON.stringify({ displayName: displayName || null, avatarUrl: avatarUrl || null }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update profile');
            }
            return response.json() as Promise<UserInfo>;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['users', 'me'], data);
            showToast('Profile updated successfully', 'success');
        },
        onError: (error: Error) => {
            showToast(error.message || 'Failed to update profile', 'error');
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
            showToast('Password changed successfully', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: Error) => {
            showToast(error.message || 'Failed to change password', 'error');
        },
    });

    const handleUpdateProfile = () => updateProfileMutation.mutate();

    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast('New password must be at least 8 characters', 'error');
            return;
        }
        if (!currentPassword) {
            showToast('Please enter your current password', 'error');
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
        if (seconds <= 0) return 'Expired';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    if (!user || isLoading || !profile) {
        return <Text>Loading...</Text>;
    }

    const handleBack = () => navigate(-1);
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
                                    <span className="bg-linear-to-l from-(--gray-12) to-(--accent-11) bg-clip-text text-transparent">
                                        User Profile
                                    </span>
                                </Flex>
                            </Heading>
                            <Button onClick={handleBack} variant="soft" color="amber">
                                <ArrowBigLeft size={16} /> Back
                            </Button>
                        </Flex>
                        <Text color="gray" size="2">View and manage your account details.</Text>
                    </header>
                )}

                <Card size="3">
                    <Flex direction="column" gap="4">
                        <Flex direction="row" gap="2" align="center">
                            <UserCircle size={14} className="text-(--accent-9)" />
                            <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">Account Information</Text>
                        </Flex>

                        <Flex gap="4" align="center" wrap="wrap">
                            <Avatar src={(isSelf ? user.imageUrl : profile.avatarUrl) ?? undefined} name={(isSelf ? user.username : profile.username) ?? 'User'} size="64" round={true} />
                            <Flex direction="column" gap="1">
                                <Text size="6" weight="bold">{displayLabel}</Text>
                                <Text size="2" color="gray">{profile.email}</Text>
                                {profile.username && profile.username !== displayLabel && (
                                    <Text size="1" color="gray">@{profile.username}</Text>
                                )}
                                <Text size="1" color="gray">ID: <Code size="1">{profile.id}</Code></Text>
                                <Flex gap="2" mt="2" wrap="wrap">
                                    <Badge color="blue" variant="soft">{profile.role}</Badge>
                                    {!profile.enabled && <Badge color="red" variant="soft">Disabled</Badge>}
                                </Flex>
                            </Flex>
                        </Flex>

                        <Separator size="4" />

                        <Grid columns={{ initial: '2', sm: '2' }} gap="4">
                            <Flex direction="column">
                                <Text size="1" color="gray">Member since</Text>
                                <Text size="3" weight="bold">{formatInstant(profile.createdAt, locale)}</Text>
                            </Flex>
                            <Flex direction="column">
                                <Text size="1" color="gray">Account age</Text>
                                <Text size="3" weight="bold">
                                    {accountAgeDays != null ? `${accountAgeDays} days` : '—'}
                                </Text>
                            </Flex>
                        </Grid>
                    </Flex>
                </Card>

                {isSelf && (
                    <Card size="3">
                        <Flex direction="column" gap="4">
                            <Flex direction="row" gap="2" align="center">
                                <ShieldCheck size={14} className="text-(--accent-9)" />
                                <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">Current Session</Text>
                            </Flex>
                            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                                <Flex direction="column" gap="1">
                                    <Text size="1" color="gray">Token issued at</Text>
                                    <Text size="3" weight="bold">
                                        {tokenIssuedAt ? formatInstant(new Date(tokenIssuedAt * 1000).toISOString(), locale) : '—'}
                                    </Text>
                                </Flex>
                                <Flex direction="column" gap="1">
                                    <Text size="1" color="gray">Token expires at</Text>
                                    <Text size="3" weight="bold">
                                        {tokenExpiration ? formatInstant(new Date(tokenExpiration * 1000).toISOString(), locale) : '—'}
                                    </Text>
                                </Flex>
                                <Flex direction="column" gap="1">
                                    <Text size="1" color="gray">Time remaining</Text>
                                    <Flex align="center" gap="2">
                                        <Clock size={14} color="var(--gray-10)" />
                                        <Text size="3" weight="bold">{formatDuration(tokenRemainingSeconds)}</Text>
                                    </Flex>
                                </Flex>
                                <Flex direction="column" gap="1">
                                    <Text size="1" color="gray">Role</Text>
                                    <Badge color="blue" variant="soft">{user.role}</Badge>
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
                                    <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">API Tokens</Text>
                                </Flex>
                                <Button variant="soft" size="2" onClick={() => navigate('/admin/api-tokens')}>Manage</Button>
                            </Flex>
                            <Grid columns={{ initial: '2', sm: '4' }} gap="4">
                                <Flex direction="column">
                                    <Text size="1" color="gray">Total</Text>
                                    <Text size="5" weight="bold">{tokenStats.total}</Text>
                                </Flex>
                                <Flex direction="column">
                                    <Text size="1" color="gray">Active</Text>
                                    <Text size="5" weight="bold" color="green">{tokenStats.active}</Text>
                                </Flex>
                                <Flex direction="column">
                                    <Text size="1" color="gray">Revoked</Text>
                                    <Text size="5" weight="bold" color="red">{tokenStats.revoked}</Text>
                                </Flex>
                                <Flex direction="column">
                                    <Text size="1" color="gray">Expired</Text>
                                    <Text size="5" weight="bold" color="amber">{tokenStats.expired}</Text>
                                </Flex>
                            </Grid>
                        </Flex>
                    </Card>
                )}

                {isSelf && (
                    <Card size="3">
                        <Flex direction="column" gap="4">
                            <Flex direction="row" gap="2" align="center">
                                <Pencil size={14} className="text-(--accent-9)" />
                                <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">Edit Profile</Text>
                            </Flex>

                            <Grid columns={{ initial: '1', sm: '2' }} gap="4" align="center">
                                <Box>
                                    <Text as="div" size="2" weight="bold">Display Name</Text>
                                    <Text as="div" size="1" color="gray">Name shown across the app</Text>
                                </Box>
                                <TextField.Root value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter display name" />

                                <Box>
                                    <Text as="div" size="2" weight="bold">Avatar URL</Text>
                                    <Text as="div" size="1" color="gray">Link to your profile image</Text>
                                </Box>
                                <Flex gap="3" align="center">
                                    <TextField.Root value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
                                    <Avatar src={user.imageUrl ?? undefined} name={user.username ?? 'User'} size="16" round={true} />
                                </Flex>
                            </Grid>

                            <Separator size="4" />

                            <Flex justify="end">
                                <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending || !profileDirty} size="3" variant="soft">
                                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>
                )}

                {isSelf && (
                    <Card size="3">
                        <Flex direction="column" gap="4">
                            <Flex direction="row" gap="2" align="center">
                                <Lock size={14} className="text-(--accent-9)" />
                                <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">Security</Text>
                            </Flex>

                            <Grid columns={{ initial: '1', sm: '2' }} gap="4" align="center">
                                <Box>
                                    <Text as="div" size="2" weight="bold">Current Password</Text>
                                    <Text as="div" size="1" color="gray">Enter your current password to verify identity</Text>
                                </Box>
                                <TextField.Root type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />

                                <Box>
                                    <Text as="div" size="2" weight="bold">New Password</Text>
                                    <Text as="div" size="1" color="gray">At least 8 characters</Text>
                                </Box>
                                <TextField.Root type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />

                                <Box>
                                    <Text as="div" size="2" weight="bold">Confirm Password</Text>
                                    <Text as="div" size="1" color="gray">Re-type your new password</Text>
                                </Box>
                                <TextField.Root type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                            </Grid>

                            <Separator size="4" />

                            <Flex justify="end">
                                <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending} size="3" variant="soft">
                                    {changePasswordMutation.isPending ? 'Saving...' : 'Change Password'}
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
