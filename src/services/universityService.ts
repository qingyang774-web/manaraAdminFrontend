import type { DegreeLevel, University } from '../types/university';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

const buildUrl = (path: string, params?: Record<string, string>) => {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, value);
      }
    });
  }
  return url.toString();
};

export interface UniversityFilters {
  search?: string;
  location?: string;
  degreeLevel?: DegreeLevel;
}

const sanitizeFilters = (filters?: UniversityFilters) => {
  if (!filters) return undefined;
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && `${value}`.trim() !== ''
    )
  );
};

export const getUniversities = async (
  filters?: UniversityFilters
): Promise<University[]> => {
  const url = buildUrl('/universities', sanitizeFilters(filters));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to fetch universities');
  }
  return response.json();
};

export const getUniversity = async (id: string): Promise<University> => {
  const response = await fetch(buildUrl(`/universities/${id}`));
  if (!response.ok) {
    throw new Error('Unable to fetch university details');
  }
  return response.json();
};

export const createUniversity = async (payload: Partial<University>) => {
  const response = await fetch(buildUrl('/universities'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('Unable to create university');
  }
  return response.json();
};

export const updateUniversity = async (id: string, payload: Partial<University>) => {
  const response = await fetch(buildUrl(`/universities/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('Unable to update university');
  }
  return response.json();
};
