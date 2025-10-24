import React, { useState, useEffect } from 'react';

// === API helpers ===
const fetchMaterials = async () => {
  try {
    const res = await fetch('/api/materials_bom');
    if (!res.ok) throw new Error('Error fetching materials');
    return await res.json();
  } catch (err) {
    console.error('❌ Error cargando materiales:', err);
    return [];
  }
};

const saveMaterials = async (data) => {
  try {
    const res = await fetch('/api/materials_bom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error saving materials');
    return true;
  } catch (err) {
    console.error('❌ Error guardando materiales:', err);
    return false;
  }
};

// === COMPONENTE PRINCIPAL ===
const MaterialManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialId, setNewMaterialId] = useState('');
  const [newMaterialStock, setNewMaterialStock] = useState(0);
  const [message, setMessage] = useState('');
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar materiales al iniciar
  useEffect(() => {
    const loadMaterials = async () => {
      setLoading(true);
      const mats = await fetchMaterials();
      setMaterials(Array.isArray(mats) ? mats : []);
      setLoading(false);
    };
    loadMaterials();
  }, []);

  const showMessage = (text, timeout = 3000) => {
    setMessage(text);
    if (timeout > 0) setTimeout(() => setMessage(''), timeout);
  };

  // Agregar nuevo material
  const handleAddMaterial = async () => {
    if (!newMaterialName || !newMaterialId || newMaterialStock < 0) {
      showMessage('⚠️ Todos los campos son obligatorios y el stock debe ser >= 0');
      return;
    }
    if (materials.some((m) => m.materialId === newMaterialId)) {
      showMessage('⚠️ Ese ID de material ya existe');
      return;
    }

    const newMaterial = {
      materialId: newMaterialId,
      name: newMaterialName,
      stock: Number(newMaterialStock),
    };

    const updated = [...materials, newMaterial];
    const ok = await saveMaterials(updated);
    if (ok) {
      setMaterials(updated);
      setNewMaterialName('');
      setNewMaterialId('');
      setNewMaterialStock(0);
      showMessage('✅ Material agregado con éxito');
    } else {
      showMessage('❌ Error guardando material en el servidor');
    }
  };

  const handleEditClick = (material) => {
    setEditingMaterial({ ...material });
    setMessage('');
  };

  const handleSaveEdit = async () => {
    if (!editingMaterial.name || editingMaterial.stock < 0) {
      showMessage('⚠️ Campos inválidos');
      return;
    }

    const updated = materials.map((m) =>
      m.materialId === editingMaterial.materialId ? editingMaterial : m
    );
    const ok = await saveMaterials(updated);
    if (ok) {
      setMaterials(updated);
      setEditingMaterial(null);
      showMessage('✅ Material actualizado');
    } else {
      showMessage('❌ Error guardando cambios');
    }
  };

  const handleCancelEdit = () => {
    setEditingMaterial(null);
    setMessage('');
  };

  const handleRemoveMaterial = async (materialId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este material?')) return;
    const updated = materials.filter((m) => m.materialId !== materialId);
    const ok = await saveMaterials(updated);
    if (ok) {
      setMaterials(updated);
      showMessage('🗑️ Material eliminado');
    } else {
      showMessage('❌ Error eliminando material');
    }
  };

  if (loading) return <p className="text-center text-gray-500 mt-10">Cargando materiales...</p>;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Gestión de Materiales (BOM)
      </h2>
      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      {/* Formulario */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          {editingMaterial ? 'Editar Material' : 'Agregar Nuevo Material'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">ID Material</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={editingMaterial ? editingMaterial.materialId : newMaterialId}
              onChange={(e) =>
                editingMaterial
                  ? setEditingMaterial({ ...editingMaterial, materialId: e.target.value })
                  : setNewMaterialId(e.target.value)
              }
              disabled={!!editingMaterial}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Nombre</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={editingMaterial ? editingMaterial.name : newMaterialName}
              onChange={(e) =>
                editingMaterial
                  ? setEditingMaterial({ ...editingMaterial, name: e.target.value })
                  : setNewMaterialName(e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Stock</label>
            <input
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={editingMaterial ? editingMaterial.stock : newMaterialStock}
              onChange={(e) =>
                editingMaterial
                  ? setEditingMaterial({
                      ...editingMaterial,
                      stock: parseInt(e.target.value) || 0,
                    })
                  : setNewMaterialStock(parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>

        {editingMaterial ? (
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleSaveEdit}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Guardar Cambios
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddMaterial}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800"
          >
            Agregar Material
          </button>
        )}
      </div>

      {/* Tabla */}
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Materiales Existentes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">ID Material</th>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Stock</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materials.length > 0 ? (
              materials.map((material) => (
                <tr key={material.materialId} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{material.materialId}</td>
                  <td className="py-3 px-4">{material.name}</td>
                  <td className="py-3 px-4">{material.stock}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleEditClick(material)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleRemoveMaterial(material.materialId)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-4 text-center text-gray-500">
                  No hay materiales registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialManagement;