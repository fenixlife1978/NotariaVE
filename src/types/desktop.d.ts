export {};



declare global {
  interface LicenseStatus { state: 'trial' | 'expired' | 'active' | 'revalidation_required'; allowed: boolean; trialStartedAt?: string; trialEndsAt?: string; remainingMs?: number; remainingHours?: number; trialDurationHours?: number; licenseName?: string; offlineUntil?: string | null; offlineDays?: number; message?: string }
  interface Window {
    notariaDesktop: {
      getStatus(): Promise<{ needsInitialAdmin: boolean; license: LicenseStatus }>;
      getLicenseStatus(): Promise<LicenseStatus>;
      activateLicense(input: { licenseKey: string }): Promise<LicenseStatus>;
      openLicensePlans(): Promise<{ opened: boolean }>;
      bootstrapAdmin(input: { username: string; fullName: string; password: string }): Promise<{ id: string; username: string; fullName: string; role: string }>;
      login(input: { username: string; password: string }): Promise<{ id: string; username: string; fullName: string; role: string }>;
      logout(): Promise<{ success: boolean }>;
      listClients(): Promise<any[]>;
      saveClient(client: object): Promise<any>;
      deleteClient(id: string): Promise<{ deleted: boolean }>;
      listDocuments(): Promise<Array<{ id: string; title: string; templateId: string; updatedAt: string; revision: number; payload: Record<string, any> }>>;
      saveDocument(input: { id?: string; title: string; templateId: string; payload: Record<string, unknown> }): Promise<{ id: string; title: string; templateId: string; updatedAt: string; revision: number; payload: Record<string, any> }>;
      createBackup(): Promise<{ canceled: boolean; fileName?: string; sha256?: string; createdAt?: string; counts?: Record<string, number> }>;
      restoreBackup(): Promise<{ canceled: boolean; restored?: boolean; fileName?: string; safetyBackup?: string; counts?: Record<string, number> }>;
      selectLegacyImport(): Promise<{ canceled: boolean; token?: string; fileName?: string; clientsCount?: number; suspectedDemoClients?: number; hasLawyer?: boolean; suspectedDemoLawyer?: boolean; hasCriteria?: boolean; suspectedDemoCriteria?: boolean }>;
      importLegacyData(token: string, options?: { includeDemoRecords?: boolean }): Promise<{ fileName: string; importedClients: number; skippedDuplicates: number; skippedDemoClients: number; lawyerImported: boolean; lawyerSkippedDemo: boolean; criteriaImported: boolean; criteriaSkippedDemo: boolean; includeDemoRecords: boolean }>;
      listAuditEvents(input?: { limit?: number; offset?: number }): Promise<Array<{ id: number; actorUserId: string | null; actorUsername?: string; actorFullName?: string; action: string; entityType: string; entityId?: string; detailsJson: string; details: Record<string, unknown>; createdAt: string }>>;
      getSetting(key: string): Promise<unknown>;
      saveSetting(key: string, value: unknown): Promise<{ saved: boolean }>;
      getAiStatus(): Promise<{ configured: boolean }>;
      saveAiKey(apiKey: string): Promise<{ saved: boolean }>;
      clearAiKey(): Promise<{ removed: boolean }>;
      generateAiClause(input: { prompt: string; currentClause?: string; context?: string; consent: boolean }): Promise<{ text: string }>;
      refreshBcvRate(input?: { force?: boolean }): Promise<{ ok: boolean; applied?: boolean; criteria?: import('./legal').SarenCriteriaConfig; record?: { rate: number; source: string; effectiveDate: string }; error?: string }>;
      saveManualBcvRate(input: { rate: number; effectiveDate?: string }): Promise<{ ok: boolean; criteria: import('./legal').SarenCriteriaConfig; record: { rate: number; source: string; effectiveDate: string } }>;
      listUsers(): Promise<Array<{ id: string; username: string; fullName: string; role: 'admin' | 'abogado' | 'asistente' | 'consulta'; active: boolean; createdAt: string; updatedAt: string }>>;
      createUser(input: { username: string; fullName: string; role: 'admin' | 'abogado' | 'asistente' | 'consulta'; password: string }): Promise<{ id: string; username: string; fullName: string; role: string; active: boolean }>;
      updateUser(input: { id: string; role?: 'admin' | 'abogado' | 'asistente' | 'consulta'; active?: boolean; fullName?: string; password?: string }): Promise<{ updated: boolean }>;
      listAttachments(input: { entityType: 'document' | 'client'; entityId: string }): Promise<Array<{ id: string; entityType: string; entityId: string; originalName: string; mimeType: string; sizeBytes: number; sha256: string; createdAt: string }>>;
      addAttachment(input: { entityType: 'document' | 'client'; entityId: string }): Promise<{ canceled: boolean; id?: string; originalName?: string; mimeType?: string; sizeBytes?: number; sha256?: string; createdAt?: string }>;
      exportAttachment(id: string): Promise<{ canceled: boolean; fileName?: string; sha256?: string }>;
      deleteAttachment(id: string): Promise<{ deleted: boolean }>;
    };
  }
}
