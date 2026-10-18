import React, { useState } from 'react';
import {
    LogOut, ChevronDown, ChevronRight, Users, KeyRound, FileBracesCorner,
    ArrowBigLeft, Cog, History, LineChart, Upload,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { Button, Dialog, Flex, Text } from '@radix-ui/themes';

interface SidebarProps {
    isOpen: boolean;
    closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
    const { logout, user } = useAuth();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [newImportOpen, setNewImportOpen] = useState(false);

    const toggleExpand = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
        );
    };

    const handleLogout = () => setLogoutDialogOpen(true);
    const confirmLogout = () => { closeSidebar(); logout(); };

    const navItems = [
        { icon: Upload, label: 'New Import', onClick: () => setNewImportOpen(true) },
        { icon: LineChart, label: 'Insights', path: '/insights' },
        { icon: History, label: 'History', path: '/history' },
        {
            icon: Cog,
            label: 'Administration',
            children: [
                { icon: Users, label: 'Users', path: '/admin/users' },
                { icon: KeyRound, label: 'API Tokens', path: '/admin/api-tokens' },
                { icon: FileBracesCorner, label: 'API Docs', path: '/admin/api-docs' },
            ]
        },
    ];

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 xl:hidden" onClick={closeSidebar} />
            )}

            <aside className={`
        fixed xl:static inset-y-0 left-0 z-30
        w-72 bg-(--sidebar-glass-bg) backdrop-blur-[50px] border-r border-[var(--glass-border)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
        flex flex-col shadow-xl
      `}>
                <div className="p-6 border-b border-[var(--glass-border)] xl:hidden">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-[var(--gray-12)] to-[var(--accent-11)] bg-clip-text text-transparent">Menu</h2>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <div key={item.path || item.label}>
                            {item.children ? (
                                <>
                                    <button
                                        onClick={() => toggleExpand(item.label)}
                                        className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors text-[var(--gray-11)] hover:bg-[var(--gray-3)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.label}</span>
                                        </div>
                                        {expandedItems.includes(item.label) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                    {expandedItems.includes(item.label) && (
                                        <div className="ml-4 space-y-1 mt-1 border-l border-[var(--gray-5)] pl-2">
                                            {item.children.map(child => (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    className={({ isActive }) => `
                                                        flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
                                                        ${isActive ? 'bg-[var(--accent-3)] text-[var(--accent-11)] font-medium' : 'text-[var(--gray-11)] hover:bg-[var(--gray-3)]'}
                                                    `}
                                                >
                                                    <child.icon className="w-4 h-4" />
                                                    <span>{child.label}</span>
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : item.path ? (
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                        ${isActive ? 'bg-[var(--accent-3)] text-[var(--accent-11)] font-medium' : 'text-[var(--gray-11)] hover:bg-[var(--gray-3)]'}
                                    `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </NavLink>
                            ) : (
                                <button
                                    onClick={item.onClick}
                                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors text-[var(--gray-11)] hover:bg-[var(--gray-3)]"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
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
                        <span>Sign Out</span>
                    </button>
                </div>

                <Dialog.Root open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                    <Dialog.Content style={{ maxWidth: 450 }}>
                        <Dialog.Title>Logging out user <span className="text-[var(--accent-10)]">{user?.username}</span></Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            Are you sure you want to log out from this session?
                        </Dialog.Description>
                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray">
                                    <ArrowBigLeft className="w-5 h-5" /> Back
                                </Button>
                            </Dialog.Close>
                            <Button variant="solid" color="red" onClick={confirmLogout}>
                                <LogOut className="w-5 h-5" /> Logout
                            </Button>
                        </Flex>
                    </Dialog.Content>
                </Dialog.Root>

                <Dialog.Root open={newImportOpen} onOpenChange={setNewImportOpen}>
                    <Dialog.Content style={{ maxWidth: 600 }}>
                        <Dialog.Title>New Import</Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            The CSV upload flow (Completed Trainings, Training Catalog, Training Timeslots, Employees) is built in a later phase.
                        </Dialog.Description>
                        <Text size="2" color="gray">Coming soon.</Text>
                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray">Close</Button>
                            </Dialog.Close>
                        </Flex>
                    </Dialog.Content>
                </Dialog.Root>
            </aside>
        </>
    );
};

export default Sidebar;
