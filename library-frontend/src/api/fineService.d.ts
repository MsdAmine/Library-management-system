export interface FineResponseDTO {
  id: number;
  borrowingRecordId?: number;
  bookId?: number;
  bookTitle?: string;
  bookAuthor?: string;
  bookIsbn?: string;
  memberId?: number;
  memberName?: string;
  memberEmail?: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'WAIVED';
  createdAt?: string;
  settledAt?: string;
  paymentReference?: string;
  notes?: string;
  dueDate?: string;
  returnDate?: string;
  daysOverdue?: number;
}

export interface FineService {
  getMyFines(): Promise<FineResponseDTO[]>;
  getMemberFines(memberId: number | string): Promise<FineResponseDTO[]>;
  getAllFines(): Promise<FineResponseDTO[]>;
  payFine(fineId: number | string, paymentReference?: string): Promise<FineResponseDTO>;
  waiveFine(fineId: number | string, notes?: string): Promise<FineResponseDTO>;
  getErrorMessage(error: any): string;
}

export const fineService: FineService;
export default fineService;
