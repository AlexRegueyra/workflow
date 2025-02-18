import { Play, Clock, Settings, Save } from 'lucide-react';

const Toolbar = ({ 
    name, 
    status = 'ready', 
    interval = '15m',
    onIntervalChange,
    onExecute, 
    onSave, 
    onSettingsClick,
    onHistoryClick,
    lastSaved
}) => {
    return (
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onExecute}
                    disabled={status === 'running'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                        ${status === 'running' 
                            ? 'bg-purple-400 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-700'} 
                        text-white`}
                >
                    <Play className={`w-4 h-4 ${status === 'running' ? 'animate-spin' : ''}`} />
                    {status === 'running' ? 'Ejecutando...' : 'Ejecutar'}
                </button>

                <div className="flex items-center gap-2 px-4 py-2 border rounded-md">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <select 
                        className="bg-transparent border-none text-sm outline-none cursor-pointer"
                        value={interval}
                        onChange={(e) => onIntervalChange?.(e.target.value)}
                        disabled={status === 'running'}
                    >
                        <option value="15m">Cada 15 minutos</option>
                        <option value="1h">Cada hora</option>
                        <option value="1d">Cada día</option>
                        <option value="manual">Manual</option>
                    </select>
                </div>

                <div className="text-sm text-gray-500">
                    {name}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {lastSaved && (
                    <span className="text-sm text-gray-400">
                        Guardado: {new Date(lastSaved).toLocaleTimeString()}
                    </span>
                )}
                
                <div className="flex items-center gap-2">
                <button 
                    onClick={onSave}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="Guardar workflow"
                    disabled={status === 'running'}
                >
                    <Save className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                    onClick={onHistoryClick}  // Nuevo botón
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="Historial de ejecuciones"
                >
                    <Clock className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                    onClick={onSettingsClick}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="Configuración"
                >
                    <Settings className="w-5 h-5 text-gray-600" />
                </button>
            </div>
            </div>
        </div>
    );
};

export default Toolbar;