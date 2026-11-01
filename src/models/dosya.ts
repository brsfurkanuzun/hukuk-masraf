export interface Dosya {
  id: string;
  ownerId: string;
  assignedUserIds: string[];
  /** clients/{id}; eski dosyalarda yok. */
  clientId?: string;
  clientName: string;
  clientNameNormalized: string;
  debtorName: string;
  enforcementOffice: string;
  enforcementOfficeNormalized: string;
  fileCaseNumber: string;
  fileCaseNumberNormalized: string;
  instructionNumber: string;
  createdAt: string;
  updatedAt: string;
}
