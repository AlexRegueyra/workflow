import { create } from 'zustand'

const useWorkflowStore = create((set) => ({
    nodes: [],
    connections: [],
    selectedNode: null,

    addNode: (node) => set((state) => ({
        nodes: [...state.nodes, { ...node, id: Date.now() }]
    })),

    updateNode: (id, data) => set((state) => ({
        nodes: state.nodes.map(node =>
            node.id === id ? { ...node, ...data } : node
        )
    })),

    removeNode: (id) => set((state) => ({
        nodes: state.nodes.filter(node => node.id !== id),
        connections: state.connections.filter(
            conn => conn.source !== id && conn.target !== id
        )
    })),

    setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
}))

export default useWorkflowStore