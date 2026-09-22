export type ReservationStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';

export interface ReservationResponseDTO {
  id: number;
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  bookAvailableCopies?: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  reservationDate: string;
  status: ReservationStatus;
  queuePosition?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export declare const reservationService: {
  placeHold(bookId: number | string, memberId?: number | string): Promise<ReservationResponseDTO>;
  getMyHolds(): Promise<ReservationResponseDTO[]>;
  getBookHoldQueue(bookId: number | string): Promise<ReservationResponseDTO[]>;
  cancelHold(reservationId: number | string): Promise<ReservationResponseDTO>;
  fulfillReservation(reservationId: number | string): Promise<ReservationResponseDTO>;
  fulfillNextHold(bookId: number | string): Promise<ReservationResponseDTO>;
  getErrorMessage(error: any): string;
};

export default reservationService;
