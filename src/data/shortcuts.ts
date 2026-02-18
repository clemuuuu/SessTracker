export interface ShortcutItem {
    key: string;
    description: string;
    category: 'Window Management' | 'General' | 'Navigation';
}

export const APP_SHORTCUTS: ShortcutItem[] = [
    // Window Management
    {
        category: 'Window Management',
        key: 'Ctrl + Shift + ←',
        description: 'Snap window Left (or Top-Left/Bottom-Left)'
    },
    {
        category: 'Window Management',
        key: 'Ctrl + Shift + →',
        description: 'Snap window Right (or Top-Right/Bottom-Right)'
    },
    {
        category: 'Window Management',
        key: 'Ctrl + Shift + ↑',
        description: 'Snap window Top (or Maximize)'
    },
    {
        category: 'Window Management',
        key: 'Ctrl + Shift + ↓',
        description: 'Snap window Bottom (or Restore/Float)'
    },
    {
        category: 'Window Management',
        key: 'Click Window',
        description: 'Focus window for shortcuts'
    },

    // Navigation
    {
        category: 'Navigation',
        key: 'Scroll Down',
        description: 'Go to Roots View'
    },
    {
        category: 'Navigation',
        key: 'Scroll Up',
        description: 'Go to Tree View'
    }
];
