import { type Node } from '@xyflow/react';

export type SubjectType = 'subject' | 'topic';

export interface Session {
    id: string;
    startTime: number;
    endTime?: number;
    duration: number; // in seconds
}

export interface RevisionNodeData extends Record<string, unknown> {
    label: string;
    type: SubjectType;
    totalTime: number; // in seconds
    sessions: Session[];
    isRunning: boolean;
}

export type RevisionNode = Node<RevisionNodeData>;
