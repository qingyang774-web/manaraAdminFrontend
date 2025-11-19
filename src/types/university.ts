export type DegreeLevel = 'bachelor' | 'masters' | 'phd';

export interface Program {
  name: string;
  duration: string;
  delivery: string;
}

export interface Scholarship {
  name: string;
  amount: string;
  eligibility: string;
  deadline: string;
}

export interface Fees {
  application: number;
  averageTuition: Partial<Record<DegreeLevel, number>>;
}

export interface University {
  id: string;
  name: string;
  portalUrl: string;
  location: string;
  overview?: string;
  fees: Fees;
  programs: Record<DegreeLevel, Program[]>;
  scholarships: Record<DegreeLevel, Scholarship[]>;
  restrictedCountries?: string[];
}

export const degreeLevels: DegreeLevel[] = ['bachelor', 'masters', 'phd'];
