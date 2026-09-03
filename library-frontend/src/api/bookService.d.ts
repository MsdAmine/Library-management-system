export interface BookDTO {
  id: number;
  title: string;
  author: string;
  isbn?: string | null;
  publicationYear?: number | null;
  genre?: string | null;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies?: number;
}

export interface BookPageResponse {
  content: BookDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface BookSearchParams {
  title?: string;
  author?: string;
  genre?: string;
  available?: boolean;
  availableOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface BookMutationPayload {
  title: string;
  author: string;
  isbn?: string | null;
  publicationYear?: number | null;
  genre?: string | null;
  totalCopies: number;
  availableCopies: number;
}

export declare const bookService: {
  getAllBooks(params?: { page?: number; size?: number; sort?: string }): Promise<BookPageResponse>;
  searchBooks(params?: BookSearchParams): Promise<BookPageResponse>;
  getBookById(id: number | string): Promise<BookDTO>;
  getBookByIsbn(isbn: string): Promise<BookDTO>;
  getBookAvailability(id: number | string): Promise<BookDTO>;
  createBook(bookData: BookMutationPayload): Promise<BookDTO>;
  updateBook(id: number | string, bookData: BookMutationPayload): Promise<BookDTO>;
  deleteBook(id: number | string): Promise<void>;
  getErrorMessage(error: unknown): string;
};

export default bookService;
