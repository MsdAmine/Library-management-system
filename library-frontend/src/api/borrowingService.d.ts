export interface BorrowingRecord {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  book: {
    id: number;
    title: string;
    author: string;
    isbn: string;
    availableCopies?: number;
    totalCopies?: number;
  };
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
  fineAmount?: number | null;
  archived: boolean;
  archivedAt?: string | null;
}

export interface ReturnRecordResponseDTO {
  recordId: number;
  bookTitle: string;
  bookIsbn: string;
  memberName: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string;
  overdue: boolean;
  daysOverdue: number;
  fineAmount: number;
}

export interface ArchiveResultDTO {
  archivedCount: number;
  retentionDays: number;
  cutoffDate: string;
  archivedAt: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export declare const borrowingService: {
  getAllBorrowings(params?: { page?: number; size?: number; sort?: string }): Promise<Page<BorrowingRecord>>;
  getMemberHistory(memberId: number | string, params?: { page?: number; size?: number; sort?: string }): Promise<Page<BorrowingRecord>>;
  getMemberActiveBorrowings(memberId: number | string): Promise<BorrowingRecord[]>;
  borrowBook(memberId: number | string, bookId: number | string): Promise<BorrowingRecord>;
  returnBook(recordId: number | string): Promise<ReturnRecordResponseDTO>;
  archiveRecords(retentionDays?: number): Promise<ArchiveResultDTO>;
  getArchivedRecords(): Promise<BorrowingRecord[]>;
  getErrorMessage(error: any): string;
};

export default borrowingService;
