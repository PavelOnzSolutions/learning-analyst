import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ToolbarAction {
    id: string;
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'classic';
    color?: 'gray' | 'gold' | 'bronze' | 'brown' | 'yellow' | 'amber' | 'orange' | 'tomato' | 'red' | 'ruby' | 'crimson' | 'pink' | 'plum' | 'purple' | 'violet' | 'iris' | 'indigo' | 'blue' | 'cyan' | 'teal' | 'jade' | 'green' | 'grass' | 'lime' | 'mint' | 'sky';
    popoverContent?: ReactNode;
    // Switch support
    isSwitch?: boolean;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    customComponent?: ReactNode;
    disabled?: boolean;
    hidden?: boolean;
    isLoading?: boolean;
}

interface ToolbarContextType {
    actions: ToolbarAction[];
    setActions: (actions: ToolbarAction[]) => void;
}

const ToolbarContext = createContext<ToolbarContextType | undefined>(undefined);

export const useToolbar = (actions: ToolbarAction[] = []) => {
    const context = useContext(ToolbarContext);
    if (!context) {
        throw new Error('useToolbar must be used within a ToolbarProvider');
    }

    useEffect(() => {
        if (actions.length > 0) {
            context.setActions(actions);
        }
        // Cleanup actions when a component unmounts
        return () => {
            if (actions.length > 0) {
                context.setActions([]);
            }
        };
        // Create a safe dependency key by excluding complex objects like popoverContent
    }, [JSON.stringify(actions.map(({ popoverContent, customComponent, ...rest }) => rest))]);

    return context;
};

// Hook for Navbar to just read actions
export const useToolbarState = () => {
    const context = useContext(ToolbarContext);
    if (!context) {
        throw new Error('useToolbarState must be used within a ToolbarProvider');
    }
    return context;
}

interface ToolbarProviderProps {
    children: ReactNode;
}

export const ToolbarProvider: React.FC<ToolbarProviderProps> = ({ children }) => {
    const [actions, setActions] = useState<ToolbarAction[]>([]);

    return (
        <ToolbarContext.Provider value={{ actions, setActions }}>
            {children}
        </ToolbarContext.Provider>
    );
};
