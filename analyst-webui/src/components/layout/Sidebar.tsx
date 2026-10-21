import React, { useState } from 'react';
import {
    LogOut, ChevronDown, ChevronRight, Users, KeyRound, FileBracesCorner,
    ArrowBigLeft, Cog, History, LineChart, Upload, SlidersHorizontal, Cpu,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Button, Dialog, Flex } from '@radix-ui/themes';
import NewImportModal from '../import/NewImportModal.tsx';
import ImportResultModal from '../import/ImportResultModal.tsx';
import type { IRunResponse } from '../../models/run.model';

interface SidebarProps {
    isOpen: boolean;
    closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
    const { logout, user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [newImportOpen, setNewImportOpen] = useState(false);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [activeRun, setActiveRun] = useState<IRunResponse | null>(null);

    const toggleExpand = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
        );
    };

    const handleLogout = () => setLogoutDialogOpen(true);
    const confirmLogout = () => { closeSidebar(); logout(); };

    const handleRunCreated = (run: IRunResponse) => {
        setActiveRun(run);
        setResultModalOpen(true);
    };

    const handleRunConfirmed = () => {
        showToast('Import run confirmed', 'success');
        navigate('/history');
    };

    const handleRunRejected = () => {
        showToast('Import run rejected', 'success');
    };

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
                { icon: SlidersHorizontal, label: 'Configuration', path: '/admin/configuration' },
                { icon: Cpu, label:'Logs & Metrics', path: '/admin/metrics' },
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
        w-72 bg-(--sidebar-glass-bg) backdrop-blur-[50px] border-r border-(--glass-border)
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
        flex flex-col shadow-xl
      `}>
                <div className="p-6 border-b border-(--glass-border) xl:hidden">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-(--gray-12) to-(--accent-11) bg-clip-text text-transparent">Menu</h2>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <div key={item.path || item.label}>
                            {item.children ? (
                                <>
                                    <button
                                        onClick={() => toggleExpand(item.label)}
                                        className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors text-(--gray-11) hover:bg-(--gray-3)"
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.label}</span>
                                        </div>
                                        {expandedItems.includes(item.label) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                    {expandedItems.includes(item.label) && (
                                        <div className="ml-4 space-y-1 mt-1 border-l border-(--gray-5) pl-2">
                                            {item.children.map(child => (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    className={({ isActive }) => `
                                                        flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
                                                        ${isActive ? 'bg-(--accent-3) text-(--accent-11) font-medium' : 'text-(--gray-11) hover:bg-(--gray-3)'}
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
                                        ${isActive ? 'bg-(--accent-3) text-(--accent-11) font-medium' : 'text-(--gray-11) hover:bg-(--gray-3)'}
                                    `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </NavLink>
                            ) : (
                                <button
                                    onClick={item.onClick}
                                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors text-(--gray-11) hover:bg-(--gray-3)"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-(--gray-5)">
                    <button
                        className="flex items-center gap-3 px-4 py-1 w-full rounded-lg text-(--red-11) hover:bg-(--red-3) transition-colors"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>

                <Dialog.Root open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                    <Dialog.Content style={{ maxWidth: 450 }}>
                        <Dialog.Title>Logging out user <span className="text-(--accent-10)">{user?.username}</span></Dialog.Title>
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

                <NewImportModal
                    open={newImportOpen}
                    onOpenChange={setNewImportOpen}
                    onCreated={handleRunCreated}
                />

                <ImportResultModal
                    run={activeRun}
                    open={resultModalOpen}
                    onOpenChange={setResultModalOpen}
                    onConfirmed={handleRunConfirmed}
                    onRejected={handleRunRejected}
                />
            </aside>
        </>
    );
};

export default Sidebar;
