import { ChatNode, ChatTree } from './types';

export function createEmptyTree(): ChatTree {
  return { nodes: {}, rootId: null, activeNodeId: null };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createNode(
  role: ChatNode['role'],
  content: string,
  parentId: string | null,
  modelName: string,
  status: ChatNode['status'] = 'complete'
): ChatNode {
  return {
    id: generateId(),
    parentId,
    role,
    content,
    timestamp: Date.now(),
    modelName,
    status,
  };
}

export function addChildNode(tree: ChatTree, node: ChatNode): ChatTree {
  const nodes = { ...tree.nodes, [node.id]: node };
  let rootId = tree.rootId;
  if (node.parentId === null) {
    rootId = node.id;
  }
  return { ...tree, nodes, rootId };
}

export function updateNode(
  tree: ChatTree,
  id: string,
  updates: Partial<ChatNode>
): ChatTree {
  const existing = tree.nodes[id];
  if (!existing) return tree;
  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [id]: { ...existing, ...updates },
    },
  };
}

export function deleteNode(tree: ChatTree, id: string): ChatTree {
  if (!tree.nodes[id]) return tree;
  const toDelete = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift()!;
    toDelete.add(cur);
    for (const n of Object.values(tree.nodes)) {
      if (n.parentId === cur) queue.push(n.id);
    }
  }
  const nodes = { ...tree.nodes };
  for (const d of Array.from(toDelete)) delete nodes[d];
  let activeNodeId = tree.activeNodeId;
  if (activeNodeId && toDelete.has(activeNodeId)) {
    activeNodeId = tree.rootId && nodes[tree.rootId] ? tree.rootId : null;
  }
  let rootId = tree.rootId;
  if (rootId && toDelete.has(rootId)) {
    rootId = Object.keys(nodes).length ? Object.keys(nodes)[0] : null;
    activeNodeId = rootId;
  }
  return { nodes, rootId, activeNodeId };
}

export function getChildren(tree: ChatTree, parentId: string): ChatNode[] {
  return Object.values(tree.nodes)
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function getPathToRoot(tree: ChatTree, nodeId: string): ChatNode[] {
  const path: ChatNode[] = [];
  let current: ChatNode | undefined = tree.nodes[nodeId];
  while (current) {
    path.unshift(current);
    current = current.parentId ? tree.nodes[current.parentId] : undefined;
  }
  return path;
}

export function getActiveThread(tree: ChatTree): ChatNode[] {
  if (!tree.activeNodeId) return [];
  return getPathToRoot(tree, tree.activeNodeId);
}

export function setActiveNode(tree: ChatTree, nodeId: string): ChatTree {
  return { ...tree, activeNodeId: nodeId };
}

export function getConversationContext(
  tree: ChatTree,
  nodeId?: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const targetId = nodeId ?? tree.activeNodeId;
  if (!targetId) return [];
  const path = getPathToRoot(tree, targetId);
  return path
    .filter((n) => n.status === 'complete' && n.content.trim())
    .map((n) => ({
      role: (n.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: n.content,
    }));
}

export function getRootNodes(tree: ChatTree): ChatNode[] {
  return Object.values(tree.nodes)
    .filter((n) => n.parentId === null)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function getSiblingGroup(tree: ChatTree, nodeId: string): ChatNode[] {
  const node = tree.nodes[nodeId];
  if (!node) return [];
  if (node.parentId === null) return [node];
  return getChildren(tree, node.parentId);
}

export function getNodeDepth(tree: ChatTree, nodeId: string): number {
  let depth = 0;
  let current: ChatNode | undefined = tree.nodes[nodeId];
  while (current && current.parentId) {
    depth++;
    current = tree.nodes[current.parentId];
  }
  return depth;
}
