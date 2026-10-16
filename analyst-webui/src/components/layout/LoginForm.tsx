import React, { useState } from 'react';
import { Button, TextField, Text, Card, Flex, Box, Callout } from '@radix-ui/themes';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';


const LoginForm = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [login_, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login({ login: login_, password });
            navigate('/');
        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card size="4" className="w-full shadow-lg">
            <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="4">
                    {error && (
                        <Callout.Root color="red">
                            <Callout.Icon>
                                <AlertCircle size={16} />
                            </Callout.Icon>
                            <Callout.Text>
                                {error}
                            </Callout.Text>
                        </Callout.Root>
                    )}

                    <Box>
                        <Text as="label" size="2" weight="bold" className="mb-1 block text-(--gray-12)">
                            Username or Email
                        </Text>
                        <TextField.Root
                            placeholder="Enter your username or email"
                            size="3"
                            value={login_}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                        >
                            <TextField.Slot>
                                <User size={16} />
                            </TextField.Slot>
                        </TextField.Root>
                    </Box>

                    <Box>
                        <Text as="label" size="2" weight="bold" className="mb-1 block text-(--gray-12)">
                            Password
                        </Text>
                        <TextField.Root
                            type="password"
                            placeholder="Enter your password"
                            size="3"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        >
                            <TextField.Slot>
                                <Lock size={16} />
                            </TextField.Slot>
                        </TextField.Root>
                    </Box>

                    <Button size="3" variant="solid" className="w-full cursor-pointer" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>

                </Flex>
            </form>
        </Card>

    );
};

export default LoginForm;
