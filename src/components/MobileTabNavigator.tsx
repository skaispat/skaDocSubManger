import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface MobileTabNavigatorProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

const MobileTabNavigator: React.FC<MobileTabNavigatorProps> = ({ tabs, activeTab, onTabChange }) => {
    const currentTab = tabs.find(t => t.id === activeTab);

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all active:scale-95 group md:hidden ml-auto"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">Switch</span>
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-[100] min-w-[200px] bg-white rounded-xl shadow-2xl border border-gray-100 p-1.5 animate-scale-in origin-top-right ring-1 ring-black/5"
                    sideOffset={8}
                    align="end"
                >
                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Department</p>
                    </div>
                    {tabs.map((tab) => (
                        <DropdownMenu.Item
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all outline-none cursor-pointer uppercase tracking-tight
                                ${activeTab === tab.id
                                    ? 'bg-red-50 text-red-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`${activeTab === tab.id ? 'text-red-600' : 'text-gray-400'}`}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </div>
                            {activeTab === tab.id && <Check size={14} className="text-red-600" />}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

export default MobileTabNavigator;
