/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { SetupAdminPage } from './components/SetupAdminPage';
import { Header } from './components/Header';
import { DocumentEditor } from './components/DocumentEditor';
import { FeeCalculatorView } from './components/FeeCalculatorView';
import { ClientDirectory } from './components/ClientDirectory';
import { SarenSettingsView } from './components/SarenSettingsModal';
import { BackupManager } from './components/BackupManager';
import { LegacyImportManager } from './components/LegacyImportManager';
import { UserAdministration } from './components/UserAdministration';
import { AttachmentManager } from './components/AttachmentManager';
import { INITIAL_LAWYER, INITIAL_SAREN_CRITERIA } from './data/initialData';
import { ClientParty, LawyerProfile, SarenCriteriaConfig, DocumentFormData } from './types/legal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; fullName: string } | null>(null);
  const [needsInitialAdmin, setNeedsInitialAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [desktopError, setDesktopError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    window.notariaDesktop.getStatus()
      .then((status) => setNeedsInitialAdmin(status.needsInitialAdmin))
      .catch((error) => setDesktopError(error instanceof Error ? error.message : 'No se pudo abrir la base de datos local.'))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const [activeTab, setActiveTab] = useState<'editor' | 'calculator' | 'clients' | 'settings' | 'users' | 'attachments'>('editor');

  const [clients, setClients] = useState<ClientParty[]>([]);
  const [lawyer, setLawyer] = useState<LawyerProfile>(INITIAL_LAWYER);
  const [criteria, setCriteria] = useState<SarenCriteriaConfig>(INITIAL_SAREN_CRITERIA);
  const [editorFormData, setEditorFormData] = useState<DocumentFormData | null>(null);
  const [editorInstanceKey, setEditorInstanceKey] = useState(0);
  const [savedDocuments, setSavedDocuments] = useState<Array<{ id: string; title: string; templateId: string; updatedAt: string; revision: number; payload: any }>>([]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    setIsLoadingData(true);
    (async () => {
      const [storedClients, storedLawyer, storedCriteria, storedDocuments] = await Promise.all([
        window.notariaDesktop.listClients(),
        window.notariaDesktop.getSetting('lawyer_profile'),
        window.notariaDesktop.getSetting('saren_criteria'),
        window.notariaDesktop.listDocuments(),
      ]);
      if (cancelled) return;
      setClients(storedClients as ClientParty[]);
      setSavedDocuments(storedDocuments);
      setLawyer((storedLawyer as LawyerProfile | null) || INITIAL_LAWYER);
      setCriteria((storedCriteria as SarenCriteriaConfig | null) || INITIAL_SAREN_CRITERIA);
    })().catch((error) => setDesktopError(error instanceof Error ? error.message : 'No se pudieron cargar los datos SQLite locales.')).finally(() => { if (!cancelled) setIsLoadingData(false); });
    return () => { cancelled = true; };
  }, [currentUser]);

  const handleRefreshLocalData = async () => {
    const [storedClients, storedLawyer, storedCriteria, storedDocuments] = await Promise.all([
      window.notariaDesktop.listClients(),
      window.notariaDesktop.getSetting('lawyer_profile'),
      window.notariaDesktop.getSetting('saren_criteria'),
      window.notariaDesktop.listDocuments(),
    ]);
    setClients(storedClients as unknown as ClientParty[]);
    setLawyer((storedLawyer as LawyerProfile | null) || INITIAL_LAWYER);
    setCriteria((storedCriteria as SarenCriteriaConfig | null) || INITIAL_SAREN_CRITERIA);
    setSavedDocuments(storedDocuments);
  };

  const handleSaveDocument = async (input: { id?: string; title: string; templateId: string; payload: Record<string, unknown> }) => {
    const saved = await window.notariaDesktop.saveDocument(input);
    setSavedDocuments((previous) => [saved, ...previous.filter((item) => item.id !== saved.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    return saved;
  };

  const handleAddClient = async (newClient: ClientParty) => {
    const saved = await window.notariaDesktop.saveClient(newClient);
    setClients((prev) => [saved as ClientParty, ...prev]);
  };

  const handleUpdateClient = async (updatedClient: ClientParty) => {
    const saved = await window.notariaDesktop.saveClient(updatedClient);
    setClients((prev) => prev.map((client) => client.id === updatedClient.id ? saved as ClientParty : client));
  };

  const handleDeleteClient = async (id: string) => {
    await window.notariaDesktop.deleteClient(id);
    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  const handleUpdateLawyer = async (updated: LawyerProfile) => {
    await window.notariaDesktop.saveSetting('lawyer_profile', updated);
    setLawyer(updated);
  };

  const handleUpdateCriteria = async (updated: SarenCriteriaConfig) => {
    await window.notariaDesktop.saveSetting('saren_criteria', updated);
    setCriteria(updated);
  };

  // 1-Click transfer from Client Directory to Document
  const handleSelectClientForDocument = (client: ClientParty, role: 'grantor' | 'grantee') => {
    setEditorFormData((prev) => {
      const base: DocumentFormData = prev || {
        templateId: 'venta-vehiculo',
        title: 'VENTA DE VEHÍCULO AUTOMOTOR',
        date: new Date().toLocaleDateString('es-VE'),
        city: '',
        state: criteria.state,
        municipality: criteria.municipality || 'Libertador',
        grantor: role === 'grantor' ? client : {},
        grantee: role === 'grantee' ? client : {},
        includeOriginOfFunds: true,
        includeLawyerVisa: true,
        includeArbitrationClause: false,
        strictProtocolFormat: true,
        customClauses: [],
      };

      if (role === 'grantor') {
        return {
          ...base,
          grantorId: client.id,
          grantor: client,
        };
      } else {
        return {
          ...base,
          granteeId: client.id,
          grantee: client,
        };
      }
    });

    setActiveTab('editor');
  };

  const handleNewDocument = () => {
    setEditorFormData(null);
    setEditorInstanceKey((value) => value + 1);
    setActiveTab('editor');
  };

  const handleUpdateBcvRate = (rate: number) => {
    void handleUpdateCriteria({ ...criteria, bcvRate: rate });
  };

  const handleLogin = (user: { username: string; role: string; fullName: string }) => {
    setCurrentUser(user);
    setNeedsInitialAdmin(false);
  };

  const handleLogout = async () => {
    await window.notariaDesktop.logout();
    setCurrentUser(null);
  };

  if (isCheckingAuth) {
    return <main className="min-h-screen bg-slate-950 text-slate-200 grid place-items-center">Comprobando base SQLite local…</main>;
  }
  if (desktopError) {
    return <main className="min-h-screen bg-slate-950 text-slate-200 grid place-items-center p-6"><div className="max-w-lg text-center"><h1 className="text-xl font-bold">No se pudo iniciar NotariaVE</h1><p className="mt-3 text-sm text-rose-300">{desktopError}</p><p className="mt-2 text-sm text-slate-400">La aplicación requiere su entorno de escritorio y su base SQLite local. No se intentará conectar a ningún servicio remoto.</p></div></main>;
  }
  if (needsInitialAdmin) return <SetupAdminPage onCreated={handleLogin} />;
  if (!currentUser) return <LoginPage onLogin={handleLogin} />;
  if (isLoadingData) return <main className="min-h-screen bg-slate-950 text-slate-200 grid place-items-center">Cargando datos desde SQLite local…</main>;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewDocument={handleNewDocument}
        bcvRate={criteria.bcvRate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'editor' && (
          <DocumentEditor
            key={editorInstanceKey}
            clients={clients}
            lawyer={lawyer}
            criteria={criteria}
            initialFormData={editorFormData}
            savedDocuments={savedDocuments}
            onSaveDocument={handleSaveDocument}
          />
        )}

        {activeTab === 'calculator' && (
          <FeeCalculatorView
            criteria={criteria}
            onUpdateBcvRate={handleUpdateBcvRate}
          />
        )}

        {activeTab === 'clients' && (
          <ClientDirectory
            clients={clients}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onSelectForDocument={handleSelectClientForDocument}
          />
        )}

        {activeTab === 'settings' && currentUser.role === 'admin' && (
          <>
          <SarenSettingsView
            criteria={criteria}
            onUpdateCriteria={handleUpdateCriteria}
            lawyer={lawyer}
            onUpdateLawyer={handleUpdateLawyer}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <BackupManager />
            <div className="mt-4"><LegacyImportManager onImported={handleRefreshLocalData} /></div>
          </div>
          </>
        )}

        {activeTab === 'users' && currentUser.role === 'admin' && <UserAdministration />}
        {activeTab === 'attachments' && <AttachmentManager documents={savedDocuments.map((doc) => ({ id: doc.id, title: doc.title }))} clients={clients.map((client) => ({ id: client.id, title: client.fullName }))} role={currentUser.role} />}
      </main>

      {/* Professional Footer with Developer Attribution */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              MVP Notaría VE
            </span>
            <span>·</span>
            <span>Gestor de Documentos y Aranceles Notariales SAREN</span>
            <span>·</span>
            <span className="text-slate-400">Art. 44 LRPN y Art. 3 Ley de Abogados</span>
          </div>

          {/* Efas Freelancer RIF: J-13313521-5 attribution */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="w-5 h-5 rounded bg-blue-600 text-white font-mono font-black text-[9px] flex items-center justify-center">
              EF
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              Desarrollado por: <strong className="text-slate-800 dark:text-slate-200">Efas Freelancer</strong> · RIF: <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">J-13313521-5</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
