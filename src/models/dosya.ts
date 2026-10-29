export interface Dosya {
  id: string;
  ownerId: string;
  assignedUserIds: string[];
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
