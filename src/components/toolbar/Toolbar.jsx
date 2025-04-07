// import { Play, Clock, Settings, Save } from 'lucide-react';

// const Toolbar = ({
//     name,
//     status = 'ready',
//     interval = '15m',
//     onIntervalChange,
//     onExecute,
//     onSave,
//     onSettingsClick,
//     onHistoryClick,
//     lastSaved,
//     notificationBell // Prop para la campanita (opcional)
// }) => {
//     return (
//         <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
//             <div className="flex items-center gap-4">
//                 <button
//                     onClick={onExecute}
//                     disabled={status === 'running'}
//                     className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
//                         ${status === 'running'
//                             ? 'bg-purple-400 cursor-not-allowed'
//                             : 'bg-purple-600 hover:bg-purple-700'} 
//                         text-white`}
//                 >
//                     <Play className={`w-4 h-4 ${status === 'running' ? 'animate-spin' : ''}`} />
//                     {status === 'running' ? 'Ejecutando...' : 'Ejecutar'}
//                 </button>

//                 <div className="flex items-center gap-2 px-4 py-2 border rounded-md">
//                     <Clock className="w-4 h-4 text-gray-500" />
//                     <select
//                         className="bg-transparent border-none text-sm outline-none cursor-pointer"
//                         value={interval}
//                         onChange={(e) => onIntervalChange?.(e.target.value)}
//                         disabled={status === 'running'}
//                     >
//                         <option value="15m">Cada 15 minutos</option>
//                         <option value="1h">Cada hora</option>
//                         <option value="1d">Cada día</option>
//                         <option value="manual">Manual</option>
//                     </select>
//                 </div>

//                 <div className="text-sm text-gray-500">
//                     {name}
//                 </div>
//             </div>

//             <div className="flex items-center gap-4">
//                 {lastSaved && (
//                     <span className="text-sm text-gray-400">
//                         Guardado: {new Date(lastSaved).toLocaleTimeString()}
//                     </span>
//                 )}

//                 <div className="flex items-center gap-2">
//                     {/* Campanita de notificaciones (opcional) */}
//                     {notificationBell && (
//                         <div className="mr-2">
//                             {notificationBell}
//                         </div>
//                     )}

//                     <button
//                         onClick={onSave}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                         title="Guardar workflow"
//                         disabled={status === 'running'}
//                         type="button"
//                     >
//                         <Save className="w-5 h-5 text-gray-600" />
//                     </button>

//                     <button
//                         onClick={onHistoryClick}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                         title="Historial de ejecuciones"
//                         type="button"
//                     >
//                         <Clock className="w-5 h-5 text-gray-600" />
//                     </button>

//                     <button
//                         onClick={onSettingsClick}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                         title="Configuración"
//                         type="button"
//                     >
//                         <Settings className="w-5 h-5 text-gray-600" />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Toolbar;


// import { useState, useEffect } from 'react';
// import { Play, Clock, Settings, Save } from 'lucide-react';

// const Toolbar = ({
//     name,
//     status = 'ready',
//     interval = '15m',
//     onIntervalChange,
//     onExecute,
//     onSave,
//     onSettingsClick,
//     onHistoryClick,
//     lastSaved,
//     notificationBell // Prop para la campanita (opcional)
// }) => {
//     const [intervalMs, setIntervalMs] = useState(15 * 60 * 1000); // 15 minutos por defecto
//     const [intervalId, setIntervalId] = useState(null);

//     // Mapea el intervalo seleccionado a milisegundos
//     const getIntervalInMs = (interval) => {
//         switch (interval) {
//             case '15m':
//                 return 15 * 60 * 1000; // 15 minutos
//             case '1h':
//                 return 60 * 60 * 1000; // 1 hora
//             case '1d':
//                 return 24 * 60 * 60 * 1000; // 1 día
//             case '30s':
//                 return 30 * 1000; // 30 segundos
//             case 'manual':
//                 return null; // No hay ejecución automática si es manual
//             default:
//                 return 15 * 60 * 1000; // 15 minutos por defecto
//         }
//     };

//     // Efecto para cambiar el intervalo cuando el valor en el select cambia
//     useEffect(() => {
//         const newIntervalMs = getIntervalInMs(interval);
//         setIntervalMs(newIntervalMs);

//         // Si el intervalo es manual, detenemos cualquier intervalo anterior
//         if (newIntervalMs === null && intervalId !== null) {
//             clearInterval(intervalId);
//             setIntervalId(null);
//         }

//         // Si hay un intervalo (no manual), creamos un nuevo intervalo
//         if (newIntervalMs !== null) {
//             if (intervalId) {
//                 clearInterval(intervalId);
//             }
//             const id = setInterval(() => {
//                 if (status !== 'running') {
//                     onExecute(); // Ejecuta el workflow en el intervalo
//                 }
//             }, newIntervalMs);
//             setIntervalId(id);
//         }

//         // Limpiar el intervalo al desmontarse
//         return () => {
//             if (intervalId) {
//                 clearInterval(intervalId);
//             }
//         };
//     }, [interval, status, onExecute]);

//     return (
//         <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
//             <div className="flex items-center gap-4">
//                 <button
//                     onClick={onExecute}
//                     disabled={status === 'running'}
//                     className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
//                         ${status === 'running'
//                             ? 'bg-purple-400 cursor-not-allowed'
//                             : 'bg-purple-600 hover:bg-purple-700'} 
//                         text-white`}
//                 >
//                     <Play className={`w-4 h-4 ${status === 'running' ? 'animate-spin' : ''}`} />
//                     {status === 'running' ? 'Ejecutando...' : 'Ejecutar'}
//                 </button>

//                 <div className="flex items-center gap-2 px-4 py-2 border rounded-md">
//                     <Clock className="w-4 h-4 text-gray-500" />
//                     <select
//                         className="bg-transparent border-none text-sm outline-none cursor-pointer"
//                         value={interval}
//                         onChange={(e) => onIntervalChange?.(e.target.value)}
//                         disabled={status === 'running'}
//                     >
//                         <option value="30s">Cada 30 segundos</option> {/* Nueva opción */}
//                         <option value="15m">Cada 15 minutos</option>
//                         <option value="1h">Cada hora</option>
//                         <option value="1d">Cada día</option>
//                         <option value="manual">Manual</option>
//                     </select>
//                 </div>

//                 <div className="text-sm text-gray-500">
//                     {name}
//                 </div>
//             </div>

//             <div className="flex items-center gap-4">
//                 {lastSaved && (
//                     <span className="text-sm text-gray-400">
//                         Guardado: {new Date(lastSaved).toLocaleTimeString()}
//                     </span>
//                 )}

//                 <div className="flex items-center gap-2">
//                     {/* Campanita de notificaciones (opcional) */}
//                     {notificationBell && (
//                         <div className="mr-2">
//                             {notificationBell}
//                         </div>
//                     )}

//                     <button
//                         onClick={onSave}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                         title="Guardar workflow"
//                         disabled={status === 'running'}
//                         type="button"
//                     >
//                         <Save className="w-5 h-5 text-gray-600" />
//                     </button>

//                     <button
//                         onClick={onHistoryClick}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                         title="Historial de ejecuciones"
//                         type="button"
//                     >
//                         <Clock className="w-5 h-5 text-gray-600" />
//                     </button>

//                     <button
//                         onClick={onSettingsClick}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                         title="Configuración"
//                         type="button"
//                     >
//                         <Settings className="w-5 h-5 text-gray-600" />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Toolbar;

import { useState, useEffect } from 'react';
import { Play, Pause, Clock, Settings, Save } from 'lucide-react';

const Toolbar = ({
    name,
    status = 'ready',
    interval = '15m',
    onIntervalChange,
    onExecute,
    onSave,
    onSettingsClick,
    onHistoryClick,
    lastSaved,
    notificationBell // Prop para la campanita (opcional)
}) => {
    const [intervalMs, setIntervalMs] = useState(15 * 60 * 1000); // 15 minutos por defecto
    const [intervalId, setIntervalId] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false); // Estado de ejecución

    // Mapea el intervalo seleccionado a milisegundos
    const getIntervalInMs = (interval) => {
        switch (interval) {
            case '5s':
                return 5 * 1000; // 30 segundos
            case '15m':
                return 5 * 60 * 1000; // 15 minutos
            case '1h':
                return 60 * 60 * 1000; // 1 hora
            case '1d':
                return 24 * 60 * 60 * 1000; // 1 día
            case 'manual':
                return null; // No hay ejecución automática si es manual
            default:
                return 15 * 60 * 1000; // 15 minutos por defecto
        }
    };

    // Efecto para cambiar el intervalo cuando el valor en el select cambia
    useEffect(() => {
        const newIntervalMs = getIntervalInMs(interval);
        setIntervalMs(newIntervalMs);

        // Si el intervalo es manual, detenemos cualquier intervalo anterior
        if (newIntervalMs === null && intervalId !== null) {
            clearInterval(intervalId);
            setIntervalId(null);
        }

        // Si hay un intervalo (no manual), creamos un nuevo intervalo
        if (newIntervalMs !== null) {
            if (intervalId) {
                clearInterval(intervalId);
            }
            const id = setInterval(() => {
                if (status !== 'running') {
                    onExecute(); // Ejecuta el workflow en el intervalo
                }
            }, newIntervalMs);
            setIntervalId(id);
        }

        // Limpiar el intervalo al desmontarse
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [interval, status, onExecute]);

    // Función para iniciar o detener la ejecución
    const handleExecuteToggle = () => {
        if (isExecuting) {
            // Detener ejecución
            clearInterval(intervalId);
            setIsExecuting(false);
            onExecute('stop'); // Llama a la función onExecute con el parámetro 'stop'
        } else {
            // Iniciar ejecución
            setIsExecuting(true);
            onExecute('start'); // Llama a la función onExecute con el parámetro 'start'
        }
    };

    return (
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={handleExecuteToggle} // Cambiar entre inicio y detención
                    disabled={status === 'running'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                        ${status === 'running' || isExecuting
                            ? 'bg-red-600 hover:bg-red-700' // Rojo para detener
                            : 'bg-purple-600 hover:bg-purple-700'} 
                        text-white`}
                >
                    {isExecuting ? (
                        <Pause className="w-4 h-4" />
                    ) : (
                        <Play className="w-4 h-4" />
                    )}
                    {isExecuting ? 'Detener' : 'Ejecutar'}
                </button>

                <div className="flex items-center gap-2 px-4 py-2 border rounded-md">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <select
                        className="bg-transparent border-none text-sm outline-none cursor-pointer"
                        value={interval}
                        onChange={(e) => onIntervalChange?.(e.target.value)}
                        disabled={status === 'running' || isExecuting}
                    >
                        <option value="5s">Cada 5 segundos</option>
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
                    {notificationBell && (
                        <div className="mr-2">
                            {notificationBell}
                        </div>
                    )}

                    <button
                        onClick={onSave}
                        className="p-2 hover:bg-gray-100 rounded-full"
                        title="Guardar workflow"
                        disabled={status === 'running' || isExecuting}
                        type="button"
                    >
                        <Save className="w-5 h-5 text-gray-600" />
                    </button>

                    <button
                        onClick={onHistoryClick}
                        className="p-2 hover:bg-gray-100 rounded-full"
                        title="Historial de ejecuciones"
                        type="button"
                    >
                        <Clock className="w-5 h-5 text-gray-600" />
                    </button>

                    <button
                        onClick={onSettingsClick}
                        className="p-2 hover:bg-gray-100 rounded-full"
                        title="Configuración"
                        type="button"
                    >
                        <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toolbar;
