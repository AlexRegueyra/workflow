import { serviceTypes } from '../../config/services';

const ServicesSidebar = () => {
    const handleDragStart = (e, service) => {
        e.dataTransfer.setData('application/json', JSON.stringify(service));
    };

    return (
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Servicios Disponibles</h2>
            <div className="space-y-2">
                {serviceTypes.map(service => {
                    const Icon = service.icon;
                    return (
                        <div
                            key={service.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, service)}
                            className="flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-gray-50 hover:border-blue-200"
                        >
                            <div className={`p-2 rounded-lg ${service.color}`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm text-gray-600">{service.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ServicesSidebar;