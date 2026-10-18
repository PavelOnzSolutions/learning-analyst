import React, {useState, useEffect} from 'react';
import {
    Menu,
    Sun,
    Moon,
    Palette,
    MoreVertical,
    Wallpaper,
    Paintbrush,
    UserPen, LogOut
} from 'lucide-react';
import {useTheme, AccentColor, accentColors, BackgroundType} from '../../context/ThemeContext.tsx';
import {useToolbarState} from '../../context/ToolbarContext.tsx';
import {usePageTitleState} from '../../context/PageTitleContext.tsx';
import {DropdownMenu, Button, Separator, Popover, Switch, Text as RadixText, Tooltip, Flex} from '@radix-ui/themes';
import logoSmall from '../../assets/logo.svg';
import {useAuth} from '../../context/AuthContext.tsx';
import {useNavigate} from "react-router-dom";
import Avatar from "react-avatar";

interface NavbarProps {
    toggleSidebar: () => void;
}

const BACKGROUND_OPTIONS: BackgroundType[] = ['orbs', 'starfield'];

const Navbar: React.FC<NavbarProps> = ({toggleSidebar}) => {
    const {
        appearance,
        toggleTheme,
        accentColor,
        setAccentColor,
        backgroundType,
        setBackgroundType,
        useAccentColorForBackground,
        setUseAccentColorForBackground
    } = useTheme();
    const {actions} = useToolbarState();
    const title = usePageTitleState();
    const {user, logout, tokenExpiration, tokenIssuedAt} = useAuth();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!tokenExpiration) {
            setTimeLeft(null);
            return;
        }

        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = Math.max(0, tokenExpiration - now);
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [tokenExpiration]);

    return (
        <header
            className="bg-(--navbar-glass-bg) backdrop-blur-[50px] border-b border-(--glass-border) h-16 flex items-center justify-between px-4 sticky top-0 z-20 transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                    className="p-2 rounded-md hover:bg-(--gray-3) transition-colors xl:hidden"
                >
                    <Menu className="w-6 h-6 text-(--gray-11)"/>
                </button>
                <img src={logoSmall} alt="Learning Analyst Logo" className="w-8 h-8"/>
                <h1 className="text-2xl">Learning Analyst</h1>
            </div>
            <div className="flex items-center gap-2 mx-2">
                <Separator orientation="vertical"/>
            </div>
            <div>
                <span
                  className="text-xl font-bold bg-(--accent-9) bg-clip-text text-transparent transition-all duration-1000 ease-linear"
                  style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                    {title}
                </span>
            </div>

            <div className="flex items-center gap-2 mx-2">
                <Separator orientation="vertical"/>
            </div>

            <div className="flex-1 flex justify-start gap-2 mx-2">
                <div className="hidden xl:flex gap-2 items-center">
                    {actions.map((action) => {
                        if (action.isSwitch) {
                            return (
                                <RadixText as="label" size="2" key={action.id} className="flex items-center gap-2 px-2">
                                    <Switch size="1" checked={action.checked} onCheckedChange={action.onCheckedChange} disabled={action.disabled} hidden={action.hidden} />
                                    {action.label}
                                </RadixText>
                            );
                        }
                        if (action.customComponent) {
                            return <React.Fragment key={action.id}>{action.customComponent}</React.Fragment>;
                        }
                        const buttonContent = (
                            <Button key={action.id} variant={action.variant || 'soft'} color={action.color}
                                    onClick={action.popoverContent ? undefined : action.onClick}
                                    className="cursor-pointer" disabled={action.disabled} hidden={action.hidden} loading={action.isLoading}>
                                {action.icon && <action.icon className="w-4 h-4 mr-2"/>}
                                {action.label}
                            </Button>
                        );
                        if (action.popoverContent) {
                            return (
                                <Popover.Root key={action.id}>
                                    <Popover.Trigger>{buttonContent}</Popover.Trigger>
                                    <Popover.Content style={{width: 360}}>{action.popoverContent}</Popover.Content>
                                </Popover.Root>
                            );
                        }
                        return buttonContent;
                    })}
                </div>

                <div className="xl:hidden">
                    {actions.length > 0 && (
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <Button variant="soft" color="gray">
                                    <MoreVertical className="w-4 h-4"/> Actions
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                                {actions.map((action) => (
                                    action.isSwitch ? (
                                        <DropdownMenu.Item key={action.id} onSelect={(e) => e.preventDefault()}>
                                            <RadixText as="label" size="2" className="flex items-center gap-2 w-full">
                                                <Switch size="1" checked={action.checked} onCheckedChange={action.onCheckedChange} disabled={action.disabled} hidden={action.hidden} />
                                                {action.label}
                                            </RadixText>
                                        </DropdownMenu.Item>
                                    ) : (
                                        <DropdownMenu.Item key={action.id} onClick={action.onClick} color={action.color} disabled={action.disabled} hidden={action.hidden}>
                                            {action.icon && <action.icon className="w-4 h-4 mr-2"/>}
                                            {action.label}
                                        </DropdownMenu.Item>
                                    )
                                ))}
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <DropdownMenu.Root>
                    <Tooltip content="Application Background">
                        <DropdownMenu.Trigger>
                            <button aria-label="Application Background" className="p-2 rounded-full hover:bg-(--gray-3) transition-colors text-(--gray-11) outline-none">
                                <Wallpaper className="w-5 h-5"/>
                            </button>
                        </DropdownMenu.Trigger>
                    </Tooltip>
                    <DropdownMenu.Content>
                        <DropdownMenu.Label>Background</DropdownMenu.Label>
                        {BACKGROUND_OPTIONS.map((type) => (
                            <DropdownMenu.Item key={type} onSelect={() => setBackgroundType(type)}
                                style={backgroundType === type ? {backgroundColor: 'var(--accent-3)'} : {}}>
                                <Flex gap="2" align="center">
                                    <Paintbrush size={16}></Paintbrush>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Flex>
                            </DropdownMenu.Item>
                        ))}
                        <Separator size="2" style={{width: '100%'}}/>
                        <DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
                            <RadixText as="label" size="2" className="flex items-center gap-2 w-full cursor-pointer">
                                <Switch size="1" checked={useAccentColorForBackground} onCheckedChange={setUseAccentColorForBackground} />
                                Use Accent Color
                            </RadixText>
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>

                <DropdownMenu.Root>
                    <Tooltip content={`Accent color: ${accentColor}`}>
                        <DropdownMenu.Trigger>
                            <button aria-label={`Accent color: ${accentColor}`} className="p-2 rounded-full hover:bg-(--accent-3) transition-colors text-(--gray-11) outline-none">
                                <Palette className="w-5 h-5"/>
                            </button>
                        </DropdownMenu.Trigger>
                    </Tooltip>
                    <DropdownMenu.Content>
                        <DropdownMenu.Label>Accent Color</DropdownMenu.Label>
                        {(accentColors as AccentColor[]).map((color) => (
                            <DropdownMenu.Item key={color} onSelect={() => setAccentColor(color)}>
                                <div className="w-4 h-4 rounded-full mr-2" style={{backgroundColor: `var(--${color}-9)`}}/>
                                {color.charAt(0).toUpperCase() + color.slice(1)}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
                <Tooltip content={appearance === 'dark' ? 'Switch to Light version' : 'Switch to Dark version'}>
                    <button onClick={toggleTheme} aria-label={appearance === 'dark' ? 'Switch to Light version' : 'Switch to Dark version'} className="p-2 rounded-full hover:bg-(--gray-3) transition-colors text-(--gray-11)">
                        {appearance === 'dark' ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
                    </button>
                </Tooltip>

                <DropdownMenu.Root>
                    <Tooltip content={timeLeft !== null ? `User session expires in: ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s` : 'User profile'}>
                        <DropdownMenu.Trigger>
                            <div className="relative flex items-center justify-center p-1 cursor-pointer group" role="button" tabIndex={0} aria-label="User menu">
                                {timeLeft !== null && tokenIssuedAt !== null && tokenExpiration !== null && (
                                    <svg className="absolute w-10 h-10 -rotate-90 pointer-events-none">
                                        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-(--gray-4)" />
                                        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="transparent"
                                            strokeDasharray={2 * Math.PI * 18}
                                            strokeDashoffset={2 * Math.PI * 18 * (1 - timeLeft / (tokenExpiration - tokenIssuedAt))}
                                            strokeLinecap="round" className="text-(--accent-9) transition-all duration-1000 ease-linear" />
                                    </svg>
                                )}
                                <Avatar src={user?.imageUrl ?? undefined} name={user?.username || 'User'} size="32" round={true} />
                            </div>
                        </DropdownMenu.Trigger>
                    </Tooltip>
                    <DropdownMenu.Content>
                        <DropdownMenu.Label>
                            <div className="flex flex-col">
                                <span>{user?.email}</span>
                            </div>
                        </DropdownMenu.Label>
                        <DropdownMenu.Item onClick={() => navigate('/profile')}>
                            <Flex gap="2" align="center"><UserPen size={16}/> Profile</Flex>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator/>
                        <DropdownMenu.Item color="red" onClick={logout}>
                            <Flex gap="2" align="center"><LogOut size={16}/> Logout</Flex>
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>
        </header>
    );
};

export default Navbar;
