export const ResultViewer = ({ result }) => {
    if (!result) return null;
    
    // Si tenemos datos en formato tabular
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const columns = Object.keys(result.data[0]);
        
        return (
            <div className="mt-4 overflow-auto max-h-96">
                <h3 className="text-sm font-medium mb-2">Resultados ({result.data.length} filas)</h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {result.data.map((row, idx) => (
                            <tr key={idx}>
                                {columns.map(col => (
                                    <td key={col} className="px-3 py-2 text-sm text-gray-500">
                                        {row[col]?.toString() || ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    
    // Para otros tipos de resultados
    return (
        <div className="mt-4">
            <div className="bg-gray-50 p-3 rounded-md">
                <div className="font-medium text-sm">{result.message || 'Operación completada'}</div>
                {result.rowsAffected !== undefined && (
                    <div className="text-sm text-gray-500">Filas afectadas: {result.rowsAffected}</div>
                )}
                {result.insertId && (
                    <div className="text-sm text-gray-500">ID insertado: {result.insertId}</div>
                )}
            </div>
        </div>
    );
};
