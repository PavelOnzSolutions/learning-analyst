import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { usePageTitle } from '../context/PageTitleContext';
import { useTheme, AccentColor, accentColors } from '../context/ThemeContext';
import { DropdownMenu } from '@radix-ui/themes';
import {Sun, Moon, Palette, Paintbrush} from 'lucide-react';
import { getHueFromAccentColor } from '../utils/color-utils.ts';

type BackgroundType = 'none' | 'orbs';

const AuthLayout = () => {
    usePageTitle('Sign in');
    const { appearance, toggleTheme, setAccentColor, accentColor } = useTheme();
    const [background, setBackground] = useState<BackgroundType>(() => {
        return (localStorage.getItem('auth_bg') as BackgroundType) || 'orbs';
    });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const lastMotionSource = useRef<'mouse' | 'gyro' | null>(null);

    useEffect(() => {
        localStorage.setItem('auth_bg', background);
    }, [background]);

    useEffect(() => {
        if (background !== 'orbs') {
            setMousePosition({ x: 0, y: 0 });
            lastMotionSource.current = null;
            return;
        }

        const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

        const smoothSetPosition = (nextX: number, nextY: number) => {
            setMousePosition((prev) => ({
                x: prev.x * 0.82 + nextX * 0.18,
                y: prev.y * 0.82 + nextY * 0.18,
            }));
        };

        const handleMouseMove = (event: MouseEvent) => {
            lastMotionSource.current = 'mouse';
            const x = (event.clientX / window.innerWidth - 0.5) * 2;
            const y = (event.clientY / window.innerHeight - 0.5) * 2;
            smoothSetPosition(x, y);
        };

        const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
            if (typeof event.gamma !== 'number' || typeof event.beta !== 'number') {
                return;
            }

            lastMotionSource.current = 'gyro';

            const x = clamp(event.gamma / 30, -1, 1);
            const y = clamp(event.beta / 45, -1, 1);

            smoothSetPosition(x, y);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('deviceorientation', handleDeviceOrientation);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('deviceorientation', handleDeviceOrientation);
        };
    }, [background]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-(--color-background) p-4 transition-colors duration-300 relative overflow-hidden opacity-90">

            {/* Background transitions */}
            <div className="absolute inset-0 z-0">
                {background === 'orbs' && (
                    <div
                        className="absolute inset-0"
                        style={{
                            perspective: '1000px',
                        }}
                    >
                        <div
                            className="auth-orbs-layer auth-orbs-layer-back absolute inset-0 bg-center bg-cover will-change-transform"
                            style={{
                                backgroundImage: 'url(/assets/images/bg-auth-2.jpg)',
                                transform: `scale(1.09) translate3d(${mousePosition.x * 6}px, ${mousePosition.y * 5}px, 0) rotateX(${mousePosition.y * -1.1}deg) rotateY(${mousePosition.x * 1.1}deg)`,
                                transition: 'transform 150ms ease-out',
                                //filter: `blur(1px) ${appearance == 'light' ? 'invert(100%)' : ''}`,
                                filter: `blur(1px)`
                            }}
                        />
                        <div
                            className="auth-orbs-layer auth-orbs-layer-mid absolute inset-0 bg-center bg-cover will-change-transform"
                            style={{
                                backgroundImage: 'url(/assets/images/bg-auth-2.jpg)',
                                transform: `scale(1.1) translate3d(${mousePosition.x * 12}px, ${mousePosition.y * 10}px, 0) rotateX(${mousePosition.y * -1.6}deg) rotateY(${mousePosition.x * 1.6}deg)`,
                                transition: 'transform 120ms ease-out',
                                //filter: `blur(0.5px) ${appearance == 'light' ? 'invert(100%)' : ''}`,
                                filter: `blur(0.5px)`
                            }}
                        />
                        <div
                            className="auth-orbs-layer auth-orbs-layer-front absolute inset-0 bg-center bg-cover will-change-transform"
                            style={{
                                backgroundImage: 'url(/assets/images/bg-auth-2.jpg)',
                                transform: `scale(1.12) translate3d(${mousePosition.x * 19}px, ${mousePosition.y * 16}px, 0) rotateX(${mousePosition.y * -2.2}deg) rotateY(${mousePosition.x * 2.2}deg)`,
                                transition: 'transform 100ms ease-out',
                                //filter: `${appearance == 'light' ? 'invert(100%)' : ''}`
                            }}
                        />
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundColor: `hsl(${getHueFromAccentColor(accentColor)} 85% 52% / 0.38)`,
                                mixBlendMode: 'multiply',
                            }}
                        />
                        
                    </div>
                )}
            </div>

            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <button className="p-2 rounded-full hover:bg-(--gray-3) transition-colors text-(--gray-11) outline-none cursor-pointer">
                            <Palette className="w-5 h-5" />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Label>Accent Color</DropdownMenu.Label>
                        {(accentColors as AccentColor[]).map((color) => (
                            <DropdownMenu.Item key={color} onSelect={() => setAccentColor(color)}>
                                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: `var(--${color}-9)` }} />
                                {color.charAt(0).toUpperCase() + color.slice(1)}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Content>
                </DropdownMenu.Root>

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-(--gray-3) transition-colors text-(--gray-11) cursor-pointer"
                >
                    {appearance === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold bg-(--accent-9) bg-clip-text text-transparent mb-2 [text-shadow:0_0_2px_var(--accent-11),0_0_5px_var(--accent-10)]">
                        Learning Analyst
                    </h1>
                    <p className="text-(--gray-11) text-lg [text-shadow:0_0_2px_var(--gray-7),0_0_6px_var(--gray-9)]">
                        <strong>CSV Import &amp; Analysis</strong>
                    </p>
                </div>

                <Outlet />
            </div>

            {/* Background Selection in the bottom right corner */}
            <div className="absolute bottom-4 right-4 z-10">
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <button className="p-2 rounded-full bg-(--gray-2) hover:bg-(--gray-3) border border-(--gray-4) transition-all text-(--gray-11) outline-none cursor-pointer shadow-lg hover:scale-110">
                            <Paintbrush className="w-5 h-5" />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end" side="top">
                        <DropdownMenu.Label>Background Animation</DropdownMenu.Label>
                        <DropdownMenu.Item onSelect={() => setBackground('none')}>
                            None {background === 'none' && '✓'}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onSelect={() => setBackground('orbs')}>
                            Orbs {background === 'orbs' && '✓'}
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>

        </div>
    );
};

export default AuthLayout;

