import React from 'react';

const DataPreview = ({ nodeId, data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-4 text-gray-500">
                Selecciona un nodo para ver la vista previa de datos
            </div>
        );
    }

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Vista previa de datos</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default DataPreview;