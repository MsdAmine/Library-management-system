export interface BookStats {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
}

export interface BorrowingStats {
  totalLifetimeBorrowings: number;
  activeBorrowings: number;
  overdueBorrowings: number;
  totalFinesCollected: number;
}

export interface MemberStats {
  totalMembers: number;
  activeBorrowers: number;
}

export interface NormalizedAnalyticsData {
  bookStats: BookStats;
  borrowingStats: BorrowingStats;
  memberStats: MemberStats;
  books: BookStats;
  borrowings: BorrowingStats & { totalBorrowings: number };
  members: MemberStats & { activeMembers: number };
}

export declare const DEFAULT_ANALYTICS: NormalizedAnalyticsData;
export declare function normalizeAnalyticsData(raw: unknown): NormalizedAnalyticsData;

export declare const analyticsService: {
  getAnalytics(): Promise<NormalizedAnalyticsData>;
  getErrorMessage(error: unknown): string;
};

export default analyticsService;
