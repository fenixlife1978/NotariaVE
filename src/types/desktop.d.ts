export {};

declare global {
  interface Window {
    notariaDesktop: {
      getStatus(): Promise<{ needsInitialAdmin: boolean }>;
      bootstrapAdmin(input: { username: string; fullName: string; password: string }): Promise<{ id: string; username: string; fullName: string; role: string }>;
      login(input: { username: string; password: string }): Promise<{ id: string; username: string; fullName: string; role: string }>;
      logout(): Promise<{ success: boolean }>;
      listClients(): Promise<Array<Record<string, unknown>>>;
      saveClient(client: Record<string, unknown>): Promise<Record<string, unknown>>;
      deleteClient(id: string): Promise<{ deleted: boolean }>;
      getSetting(key: string): Promise<unknown>;
      saveSetting(key: string, value: unknown): Promise<{ saved: boolean }>;
    };
  }
}
