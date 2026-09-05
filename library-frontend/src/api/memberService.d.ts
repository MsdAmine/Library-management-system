export interface MemberDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  membershipDate: string;
  active?: boolean;
}

export interface MemberPageResponse {
  content: MemberDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface MemberSearchParams {
  name?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface MemberMutationPayload {
  firstName: string;
  lastName: string;
  email: string;
  membershipDate: string;
  password?: string;
}

export interface UserSystemDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'LIBRARIAN' | 'USER';
  active: boolean;
  membershipDate?: string;
}

export declare const memberService: {
  getAllMembers(params?: { page?: number; size?: number; sort?: string }): Promise<MemberPageResponse>;
  searchMembers(params?: MemberSearchParams): Promise<MemberPageResponse>;
  getMemberById(id: number | string): Promise<MemberDTO>;
  createMember(memberData: MemberMutationPayload): Promise<MemberDTO>;
  updateMember(id: number | string, memberData: MemberMutationPayload): Promise<MemberDTO>;
  deleteMember(id: number | string): Promise<void>;
  getAllUsers(): Promise<UserSystemDTO[]>;
  getErrorMessage(error: unknown): string;
};

export default memberService;
