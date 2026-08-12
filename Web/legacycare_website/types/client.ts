export interface User {
  userId: string;
  fullName: string;
  email: string;
  role: number;
  idNumber: string;
  cellNo: string;
  address: string;
  dateCreated: string;
  isActive: boolean;
  lastLogin?: string | null;
}

export interface Client {
  clientId: string;
  userId: string;
  displayClientId: string;
  user: User;
}