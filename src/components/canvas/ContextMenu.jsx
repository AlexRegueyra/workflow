// src/components/canvas/ContextMenu.jsx
import { useState, useEffect, useRef } from 'react';
import {
    Copy, Clipboard, Trash2, AlignLeft, AlignRight, AlignVerticalJustifyCenter,
    AlignHorizontalJustifyCenter, ScissorsLineDashed, Grid, CornerDownRight
} from 'lucide-react';

const ContextMenu = ({
    x,
    y,
    node,
    connections,
    onClose,
    onCopy,
    onPaste,
    onDuplicate,
    onDelete,
    onDeleteConnections,
    onAlign,
    showGrid,
    onToggleGrid
}) => {
    const menuRef = useRef(null);
    const [copiedNode, setCopiedNode] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleCopy = () => {
        onCopy(node);
        setCopiedNode(node);
        onClose();
    };

    const handlePaste = () => {
        onPaste(copiedNode);
        onClose();
    };

    const handleDuplicate = () => {
        onDuplicate(node);
        onClose();
    };

    const handleDelete = () => {
        onDelete(node);
        onClose();
    };

    const handleDeleteConnections = () => {
        onDeleteConnections(node);
        onClose();
    };

    const handleAlign = (direction) => {
        onAlign(node, direction);
        onClose();
    };

    const menuItems = [
        {
            label: 'Copiar',
            icon: <Copy size={16} />,
            action: handleCopy,
            divider: false
        },
        {
            label: 'Pegar',
            icon: <Clipboard size={16} />,
            action: handlePaste,
            disabled: !copiedNode,
            divider: true
        },
        {
            label: 'Duplicar',
            icon: <CornerDownRight size={16} />,
            action: handleDuplicate,
            divider: false
        },
        {
            label: 'Eliminar',
            icon: <Trash2 size={16} />,
            action: handleDelete,
            divider: false,
            danger: true
        },
        {
            label: 'Eliminar conexiones',
            icon: <ScissorsLineDashed size={16} />,
            action: handleDeleteConnections,
            disabled: !connections || connections.length === 0,
            divider: true
        },
        {
            label: 'Alinear izquierda',
            icon: <AlignLeft size={16} />,
            action: () => handleAlign('left'),
            divider: false
        },
        {
            label: 'Alinear derecha',
            icon: <AlignRight size={16} />,
            action: () => handleAlign('right'),
            divider: false
        },
        {
            label: 'Alinear arriba',
            icon: <AlignVerticalJustifyCenter size={16} />,
            action: () => handleAlign('top'),
            divider: false
        },
        {
            label: 'Alinear abajo',
            icon: <AlignHorizontalJustifyCenter size={16} />,
            action: () => handleAlign('bottom'),
            divider: true
        },
        {
            label: showGrid ? 'Ocultar cuadrícula' : 'Mostrar cuadrícula',
            icon: <Grid size={16} />,
            action: onToggleGrid,
            divider: false
        }
    ];

    return (
        <div
            ref={menuRef}
            className="absolute bg-white rounded-lg shadow-lg py-2 z-50 min-w-48 border border-gray-200 overflow-hidden"
            style={{
                left: x,
                top: y,
                maxHeight: '80vh',
                overflowY: 'auto'
            }}
        >
            {menuItems.map((item, index) => (
                <div key={index}>
                    <button
                        className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 transition-colors duration-150 ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            } ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
                        onClick={item.action}
                        disabled={item.disabled}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                    {item.divider && <div className="h-px bg-gray-200 mx-2 my-1" />}
                </div>
            ))}
        </div>
    );
};

export default ContextMenu;