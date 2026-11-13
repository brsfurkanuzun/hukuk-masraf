export interface Dosya {
  id: string;
  ownerId: string;
  assignedUserIds: string[];
  /** clients/{id}; eski dosyalarda yok. */
  clientId?: string;
  /** Özel müvekkil dosyası: bu role sahip herkes atama olmadan görür (yalnızca masraf girilir). */
  visibleToRole?: string;
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
