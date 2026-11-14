export {};

declare global {
  interface Window {
    notariaDesktop: {
      getStatus(): Promise<{ needsInitialAdmin: boolean }>;
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
      getSetting(key: string): Promise<unknown>;
      saveSetting(key: string, value: unknown): Promise<{ saved: boolean }>;
    };
  }
}
