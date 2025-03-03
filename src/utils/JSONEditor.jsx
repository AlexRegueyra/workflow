import React, { useState, useRef, useEffect } from 'react';
import { Code, AlertTriangle } from 'lucide-react';

const JSONEditor = ({ 
    value, 
    onChange, 
    placeholder = '{}', 
    label = 'JSON Input',
    height = 'min-h-[100px]'
}) => {
    const [jsonText, setJsonText] = useState(
        typeof value === 'object' 
            ? JSON.stringify(value, null, 2) 
            : value || placeholder
    );
    const [jsonError, setJsonError] = useState(null);
    const textareaRef = useRef(null);

    // Función mejorada de formateo y validación
    const formatJSON = () => {
        try {
            // Reemplazar comillas simples por comillas dobles
            let fixedJson = jsonText
                .replace(/'/g, '"')  // Reemplazar comillas simples
                .replace(/([a-zA-Z0-9_]+):/g, '"$1":')  // Agregar comillas a las claves sin comillas
                .trim();

            // Si no tiene llaves, intentar envolverlo
            if (!fixedJson.startsWith('{')) {
                fixedJson = `{${fixedJson}}`;
            }

            // Parsear y formatear
            const parsed = JSON.parse(fixedJson);
            const formatted = JSON.stringify(parsed, null, 2);
            
            setJsonText(formatted);
            onChange(parsed);
            setJsonError(null);
        } catch (error) {
            setJsonError({
                message: `JSON Formatting Error: ${error.message}`,
                line: error.message.match(/at line (\d+)/)?.[1]
            });
        }
    };

    // Validar JSON al cambiar
    const validateAndChange = (text) => {
        setJsonText(text);
        
        try {
            // Intentar parsear JSON con las mismas correcciones
            let fixedText = text
                .replace(/'/g, '"')
                .replace(/([a-zA-Z0-9_]+):/g, '"$1":')
                .trim();

            if (!fixedText.startsWith('{')) {
                fixedText = `{${fixedText}}`;
            }

            const parsedJson = JSON.parse(fixedText);
            
            // Limpiar errores
            setJsonError(null);
            
            // Llamar al onChange con el objeto parseado
            onChange(parsedJson);
        } catch (error) {
            // Establecer mensaje de error
            setJsonError({
                message: error.message,
                line: error.message.match(/at line (\d+)/)?.[1]
            });
        }
    };

    // Añadir soporte para tabulación
    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const value = e.target.value;
            
            // Insertar espacios en lugar de tab
            e.target.value = value.substring(0, start) + '  ' + value.substring(end);
            
            // Mover cursor
            e.target.selectionStart = e.target.selectionEnd = start + 2;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <button 
                    type="button"
                    onClick={formatJSON}
                    className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                    <Code size={14} />
                    Format
                </button>
            </div>
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={jsonText}
                    onChange={(e) => validateAndChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm ${height} ${jsonError ? 'border-red-500' : ''}`}
                />
                {jsonError && (
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <AlertTriangle 
                            className="text-red-500" 
                            size={20} 
                            title={`JSON Error: ${jsonError.message}`} 
                        />
                    </div>
                )}
            </div>
            {jsonError && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {jsonError.message}
                </p>
            )}
        </div>
    );
};

export default JSONEditor;