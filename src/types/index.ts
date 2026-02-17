import { type Node } from '@xyflow/react';

export type SubjectType = 'subject' | 'topic';

export interface RevisionNodeData extends Record<string, unknown> {
    label: string;
    type: SubjectType;
    totalTime: number; // in seconds
    isRunning: boolean;
}

export type RevisionNode = Node<RevisionNodeData>;
