export const validateWorkflow = (nodes, connections) => {
    const errors = [];

    // Verificar nodos sin conexiones
    const isolatedNodes = nodes.filter(node => {
        const hasConnection = connections.some(
            conn => conn.sourceId === node.id || conn.targetId === node.id
        );
        return !hasConnection;
    });

    if (isolatedNodes.length > 0) {
        errors.push({
            type: 'isolated_nodes',
            message: 'Hay nodos sin conectar en el workflow',
            nodes: isolatedNodes
        });
    }

    // Verificar ciclos en el workflow
    const hasCycle = detectCycle(nodes, connections);
    if (hasCycle) {
        errors.push({
            type: 'cycle_detected',
            message: 'El workflow contiene ciclos'
        });
    }

    // Verificar configuración de nodos
    nodes.forEach(node => {
        if (!node.config || Object.keys(node.config).length === 0) {
            errors.push({
                type: 'missing_config',
                message: `El nodo ${node.id} no está configurado`,
                nodeId: node.id
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

const detectCycle = (nodes, connections) => {
    const visited = new Set();
    const recStack = new Set();

    const dfs = (nodeId) => {
        if (recStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recStack.add(nodeId);

        const outgoingConnections = connections.filter(conn => conn.sourceId === nodeId);
        for (const conn of outgoingConnections) {
            if (dfs(conn.targetId)) return true;
        }

        recStack.delete(nodeId);
        return false;
    };

    for (const node of nodes) {
        if (dfs(node.id)) return true;
    }

    return false;
};