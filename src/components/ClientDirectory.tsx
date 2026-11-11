import React, { useState } from 'react';
import { Users, Search, Plus, Edit, Trash2, Building2, User, ArrowRight, FileCheck, Phone, Mail, MapPin } from 'lucide-react';
import { ClientParty } from '../types/legal';

interface ClientDirectoryProps {
  clients: ClientParty[];
  onAddClient: (client: ClientParty) => void;
  onUpdateClient: (client: ClientParty) => void;
  onDeleteClient: (id: string) => void;
  onSelectForDocument: (client: ClientParty, role: 'grantor' | 'grantee') => void;
}

export const ClientDirectory: React.FC<ClientDirectoryProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectForDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'natural' | 'juridica'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<ClientParty> | null>(null);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.idCardNumber.includes(searchTerm) ||
      c.rifNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.profession.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleStartCreate = () => {
    setEditingClient({
      id: `cli-${Date.now()}`,
      type: 'natural',
      fullName: '',
      idCardType: 'V',
      idCardNumber: '',
      rifType: 'V',
      rifNumber: '',
      nationality: 'venezolano(a)',
      maritalStatus: 'soltero',
      profession: '',
      address: {
        state: 'Distrito Capital',
        municipality: 'Libertador',
        parish: '',
        street: '',
        building: '',
        apartment: '',
      },
      phone: '',
      email: '',
      notes: '',
    });
    setIsEditing(true);
  };

  const handleStartEdit = (client: ClientParty) => {
    setEditingClient({ ...client });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.fullName) return;

    const fullClient = editingClient as ClientParty;
    const exists = clients.some((c) => c.id === fullClient.id);

    if (exists) {
      onUpdateClient(fullClient);
    } else {
      onAddClient(fullClient);
    }

    setIsEditing(false);
    setEditingClient(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-500" />
            Directorio Único de Clientes y Partes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Carga los datos una sola vez (Cédula, RIF, Estado Civil, Dirección) y reutilízalos en cualquier documento notarial o mercantil sin transcribir.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, Cédula, RIF o Ocupación..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setTypeFilter('natural')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'natural'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Personas Naturales ({clients.filter((c) => c.type === 'natural').length})
          </button>
          <button
            onClick={() => setTypeFilter('juridica')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'juridica'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Personas Jurídicas ({clients.filter((c) => c.type === 'juridica').length})
          </button>
        </div>
      </div>

      {/* Grid of Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const isJuridica = client.type === 'juridica';

          return (
            <div
              key={client.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isJuridica
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isJuridica ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {client.fullName}
                      </h3>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isJuridica ? 'Sociedad Mercantil' : client.profession || 'Persona Natural'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(client)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                      title="Editar datos del cliente"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteClient(client.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      title="Eliminar del directorio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Fiscal & Identification info */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">
                      {isJuridica ? 'C.I. Representante' : 'Cédula de Identidad'}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {client.idCardType}-{client.idCardNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">
                      R.I.F. Fiscal
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {client.rifType}-{client.rifNumber}
                    </span>
                  </div>

                  {!isJuridica && (
                    <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Estado Civil:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 capitalize text-[11px]">
                        {client.maritalStatus}{' '}
                        {client.maritalStatus === 'casado' && client.spouseName ? `(c/ ${client.spouseName})` : ''}
                      </span>
                    </div>
                  )}

                  {isJuridica && client.legalRepName && (
                    <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                      <span className="text-slate-500 text-[10px] block">Representante Legal:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                        {client.legalRepName} ({client.legalRepRole || 'Representante'})
                      </span>
                    </div>
                  )}
                </div>

                {/* Address */}
                {client.address && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {[
                        client.address.street,
                        client.address.building,
                        client.address.municipality,
                        client.address.state,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons to use immediately in Document */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectForDocument(client, 'grantor')}
                  className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold rounded-md transition-colors text-center"
                >
                  Usar como Otorgante
                </button>
                <button
                  type="button"
                  onClick={() => onSelectForDocument(client, 'grantee')}
                  className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold rounded-md transition-colors text-center"
                >
                  Usar como Adquirente
                </button>
              </div>
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No se encontraron clientes registrados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Prueba con otro término de búsqueda o registra un nuevo cliente en el directorio.
            </p>
            <button
              onClick={handleStartCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-lg text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Cliente</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Edit / Create Client */}
      {isEditing && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-2xl w-full my-8">
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingClient.fullName ? 'Editar Datos del Cliente' : 'Nuevo Cliente / Otorgante'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Persona:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="type"
                        checked={editingClient.type === 'natural'}
                        onChange={() => setEditingClient({ ...editingClient, type: 'natural' })}
                      />
                      <span>Persona Natural</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="type"
                        checked={editingClient.type === 'juridica'}
                        onChange={() => setEditingClient({ ...editingClient, type: 'juridica' })}
                      />
                      <span>Persona Jurídica (Empresa / C.A. / S.R.L. / F.P.)</span>
                    </label>
                  </div>
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {editingClient.type === 'juridica' ? 'Razón Social Completa:' : 'Nombre y Apellidos Completos (según Cédula):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClient.fullName || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, fullName: e.target.value })}
                    placeholder={editingClient.type === 'juridica' ? 'Ej: INVERSIONES MONTE SACRO, C.A.' : 'Ej: CARLOS EDUARDO MENDOZA SILVA'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Cedula & RIF */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {editingClient.type === 'juridica' ? 'Cédula Representante:' : 'Cédula de Identidad:'}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={editingClient.idCardType || 'V'}
                        onChange={(e) => setEditingClient({ ...editingClient, idCardType: e.target.value as any })}
                        className="px-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={editingClient.idCardNumber || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, idCardNumber: e.target.value })}
                        placeholder="14.892.341"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Registro de Información Fiscal (R.I.F.):
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={editingClient.rifType || (editingClient.type === 'juridica' ? 'J' : 'V')}
                        onChange={(e) => setEditingClient({ ...editingClient, rifType: e.target.value as any })}
                        className="px-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                        <option value="J">J-</option>
                        <option value="G">G-</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={editingClient.rifNumber || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, rifNumber: e.target.value })}
                        placeholder="14892341-2"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Natural person specific: Marital status and profession */}
                {editingClient.type === 'natural' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Estado Civil:
                      </label>
                      <select
                        value={editingClient.maritalStatus || 'soltero'}
                        onChange={(e) => setEditingClient({ ...editingClient, maritalStatus: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      >
                        <option value="soltero">Soltero(a)</option>
                        <option value="casado">Casado(a)</option>
                        <option value="divorciado">Divorciado(a)</option>
                        <option value="viudo">Viudo(a)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Profesión u Ocupación:
                      </label>
                      <input
                        type="text"
                        value={editingClient.profession || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, profession: e.target.value })}
                        placeholder="Ej: comerciante, ingeniero, abogado"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {editingClient.maritalStatus === 'casado' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Nombre del Cónyuge:
                          </label>
                          <input
                            type="text"
                            value={editingClient.spouseName || ''}
                            onChange={(e) => setEditingClient({ ...editingClient, spouseName: e.target.value })}
                            placeholder="Nombre y apellido del cónyuge"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Cédula del Cónyuge:
                          </label>
                          <input
                            type="text"
                            value={editingClient.spouseIdCard || ''}
                            onChange={(e) => setEditingClient({ ...editingClient, spouseIdCard: e.target.value })}
                            placeholder="V-XX.XXX.XXX"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Company specific fields */}
                {editingClient.type === 'juridica' && (
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nombre del Representante Legal:
                        </label>
                        <input
                          type="text"
                          value={editingClient.legalRepName || ''}
                          onChange={(e) => setEditingClient({ ...editingClient, legalRepName: e.target.value })}
                          placeholder="Nombre del Presidente / Administrador"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Cargo / Función:
                        </label>
                        <input
                          type="text"
                          value={editingClient.legalRepRole || ''}
                          onChange={(e) => setEditingClient({ ...editingClient, legalRepRole: e.target.value })}
                          placeholder="Presidente, Director General..."
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Datos del Registro Mercantil (Tomo, Número, Fecha):
                      </label>
                      <input
                        type="text"
                        value={editingClient.mercantileRegistrationData || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, mercantileRegistrationData: e.target.value })}
                        placeholder="Inscrita en el Registro Mercantil Primero del Estado... bajo el N°..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Address Section */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Domicilio Fiscal / Notarial:
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Estado:</label>
                      <input
                        type="text"
                        value={editingClient.address?.state || ''}
                        onChange={(e) =>
                          setEditingClient({
                            ...editingClient,
                            address: { ...editingClient.address!, state: e.target.value },
                          })
                        }
                        placeholder="Miranda / Dto. Capital"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Municipio:</label>
                      <input
                        type="text"
                        value={editingClient.address?.municipality || ''}
                        onChange={(e) =>
                          setEditingClient({
                            ...editingClient,
                            address: { ...editingClient.address!, municipality: e.target.value },
                          })
                        }
                        placeholder="Chacao / Libertador"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Parroquia:</label>
                      <input
                        type="text"
                        value={editingClient.address?.parish || ''}
                        onChange={(e) =>
                          setEditingClient({
                            ...editingClient,
                            address: { ...editingClient.address!, parish: e.target.value },
                          })
                        }
                        placeholder="Chacao / Sucre"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-slate-500 mb-1">Avenida / Calle / Urbanización:</label>
                      <input
                        type="text"
                        value={editingClient.address?.street || ''}
                        onChange={(e) =>
                          setEditingClient({
                            ...editingClient,
                            address: { ...editingClient.address!, street: e.target.value },
                          })
                        }
                        placeholder="Av. Francisco de Miranda, Urb. Los Palos Grandes"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Edificio / Casa / Piso:</label>
                      <input
                        type="text"
                        value={editingClient.address?.building || ''}
                        onChange={(e) =>
                          setEditingClient({
                            ...editingClient,
                            address: { ...editingClient.address!, building: e.target.value },
                          })
                        }
                        placeholder="Torre B, Piso 5, Apto 5-A"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono de Contacto:
                    </label>
                    <input
                      type="text"
                      value={editingClient.phone || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                      placeholder="+58 414-123-4567"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico:
                    </label>
                    <input
                      type="email"
                      value={editingClient.email || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                      placeholder="cliente@ejemplo.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs"
                >
                  Guardar en Directorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
