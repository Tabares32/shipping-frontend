import React, { useState, useEffect } from 'react';

// === API helpers ===
const fetchFinishedGoods = async () => {
  try {
    const res = await fetch('/api/customFinishedGoods');
    if (!res.ok) throw new Error('Error fetching finished goods');
    return await res.json();
  } catch (err) {
    console.error('❌ Error cargando finished goods:', err);
    return [];
  }
};

const saveFinishedGoods = async (data) => {
  try {
    const res = await fetch('/api/customFinishedGoods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error saving finished goods');
    return true;
  } catch (err) {
    console.error('❌ Error guardando finished goods:', err);
    return false;
  }
};

const fetchMaterials = async () => {
  try {
    const res = await fetch('/api/materials_bom');
    if (!res.ok) throw new Error('Error fetching materials');
    return await res.json();
  } catch (err) {
    console.error('❌ Error cargando materiales (BOM):', err);
    return [];
  }
};

// === COMPONENTE PRINCIPAL ===
const FinishedGoodManagement = () => {
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [newFinishedGoodName, setNewFinishedGoodName] = useState('');
  const [newType, setNewType] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('');
  const [newBOM, setNewBOM] = useState([]);
  const [message, setMessage] = useState('');
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // === Cargar datos al iniciar ===
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [fg, mats] = await Promise.all([fetchFinishedGoods(), fetchMaterials()]);
      setFinishedGoods(Array.isArray(fg) ? fg : []);
      setAvailableMaterials(Array.isArray(mats) ? mats : []);
      setLoading(false);
    };
    loadData();
    initializeBOMSlots();
  }, []);

  // Crear estructura vacía de BOM (16 posiciones)
  const initializeBOMSlots = () => {
    const slots = Array.from({ length: 16 }, () => ({
      materialId: '',
      name: '',
      quantity: 0,
    }));
    setNewBOM(slots);
  };

  const showMessage = (txt, timeout = 3000) => {
    setMessage(txt);
    if (timeout > 0) setTimeout(() => setMessage(''), timeout);
  };

  // === Modificar materiales dentro del BOM ===
  const handleMaterialChangeInBOM = (index, field, value) => {
    const updated = newBOM.slice();
    updated[index] = { ...updated[index], [field]: field === 'quantity' ? Number(value) : value };

    if (field === 'materialId' && value) {
      const material =
        availableMaterials.find((m) => m.materialId === value) ||
        availableMaterials.find((m) => m.id === value);
      updated[index].name = material ? material.name || material.nombre || '' : '';
    }

    setNewBOM(updated);
  };

  // === Agregar nuevo Finished Good ===
  const handleAddFinishedGood = async () => {
    const filteredBOM = newBOM.filter((b) => b.materialId && Number(b.quantity) > 0);

    if (!newFinishedGoodName || !newType || !newVehicleType || filteredBOM.length === 0) {
      showMessage('⚠️ Completa todos los campos y agrega al menos un material válido al BOM.', 4000);
      return;
    }

    const newFG = {
      finishedGood: newFinishedGoodName,
      type: newType,
      vehicleType: newVehicleType,
      bom: filteredBOM.map((b) => ({
        materialId: b.materialId,
        name: b.name || '',
        quantity: Number(b.quantity),
      })),
    };

    const updated = [...finishedGoods, newFG];
    const ok = await saveFinishedGoods(updated);
    if (ok) {
      setFinishedGoods(updated);
      setNewFinishedGoodName('');
      setNewType('');
      setNewVehicleType('');
      initializeBOMSlots();
      showMessage('✅ ¡Finished Good agregado con éxito!');
    } else {
      showMessage('❌ Error guardando Finished Good en el servidor');
    }
  };

  // === Eliminar Finished Good ===
  const handleRemoveFinishedGood = async (fgToRemove) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${fgToRemove}"?`)) return;
    const updated = finishedGoods.filter((f) => f.finishedGood !== fgToRemove);
    const ok = await saveFinishedGoods(updated);
    if (ok) {
      setFinishedGoods(updated);
      showMessage(`🗑️ Finished Good "${fgToRemove}" eliminado.`);
    } else {
      showMessage('❌ Error al eliminar Finished Good en el servidor');
    }
  };

  if (loading)
    return <p className="text-center text-gray-500 mt-10">Cargando datos...</p>;

  // === Render principal ===
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Gestión de Finished Goods
      </h2>

      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      {/* Formulario de nuevo FG */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Agregar Nuevo Finished Good
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Nombre Finished Good
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={newFinishedGoodName}
              onChange={(e) => setNewFinishedGoodName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Tipo (Front/Rear)
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              <option value="">Selecciona</option>
              <option value="Front">Front</option>
              <option value="Rear">Rear</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Tipo de Vehículo
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={newVehicleType}
              onChange={(e) => setNewVehicleType(e.target.value)}
            >
              <option value="">Selecciona</option>
              <option value="Pickup">Pickup</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
            </select>
          </div>
        </div>

        {/* BOM */}
        <h4 className="text-lg font-semibold text-gray-700 mb-3">
          Bill of Materials (BOM) - 16 Materiales
        </h4>
        {newBOM.map((item, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 mb-2">
            <div className="col-span-2">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={item.materialId}
                onChange={(e) =>
                  handleMaterialChangeInBOM(index, 'materialId', e.target.value)
                }
              >
                <option value="">Material {index + 1}</option>
                {availableMaterials.map((material) => (
                  <option
                    key={material.materialId || material.id}
                    value={material.materialId || material.id}
                  >
                    {(material.materialId || material.id)} - {material.name || material.nombre}{' '}
                    (Stock: {material.stock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={item.quantity}
                onChange={(e) =>
                  handleMaterialChangeInBOM(index, 'quantity', e.target.value)
                }
                min="0"
              />
            </div>
          </div>
        ))}

        <button
          onClick={handleAddFinishedGood}
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition mt-4 font-semibold"
        >
          Agregar Finished Good
        </button>
      </div>

      {/* Tabla de FG existentes */}
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Finished Goods Existentes
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Finished Good</th>
              <th className="py-3 px-4 text-left">Tipo</th>
              <th className="py-3 px-4 text-left">Vehículo</th>
              <th className="py-3 px-4 text-left">BOM</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {finishedGoods.length > 0 ? (
              finishedGoods.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{item.finishedGood}</td>
                  <td className="py-3 px-4">{item.type}</td>
                  <td className="py-3 px-4">{item.vehicleType}</td>
                  <td className="py-3 px-4 text-sm">
                    {item.bom && item.bom.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {item.bom.map((mat, j) => (
                          <li key={j}>
                            <strong>{mat.materialId}</strong> (x{mat.quantity}){' '}
                            {mat.name ? `- ${mat.name}` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleRemoveFinishedGood(item.finishedGood)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-500">
                  No hay Finished Goods registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinishedGoodManagement;