import type { DegreeLevel, University } from '../types/university';
import seedUniversities from '../data/universities.json';

export interface UniversityFilters {
  search?: string;
  location?: string;
  degreeLevel?: DegreeLevel;
}

const STORAGE_KEY = 'manara_universities';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const normalizeUniversity = (uni: University): University => ({
  ...uni,
  restrictedCountries: (uni.restrictedCountries ?? []).map((country) => country.trim()).filter(Boolean)
});
let inMemoryStore: University[] = clone(
  (seedUniversities satisfies University[]).map((uni) => normalizeUniversity(uni))
);

const getStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

const readStore = (): University[] => {
  const storage = getStorage();
  if (!storage) {
    return clone(inMemoryStore);
  }
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    storage.setItem(STORAGE_KEY, JSON.stringify(inMemoryStore));
    return clone(inMemoryStore);
  }
  try {
    const parsed = JSON.parse(raw) as University[];
    inMemoryStore = parsed.map((uni) => normalizeUniversity(uni));
    return clone(inMemoryStore);
  } catch {
    storage.removeItem(STORAGE_KEY);
    storage.setItem(STORAGE_KEY, JSON.stringify(inMemoryStore));
    return clone(inMemoryStore);
  }
};

const writeStore = (data: University[]) => {
  const normalized = data.map((uni) => normalizeUniversity(uni));
  inMemoryStore = clone(normalized);
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(inMemoryStore));
  }
};

const filterUniversities = (universities: University[], filters?: UniversityFilters) => {
  if (!filters) return universities;
  return universities.filter((university) => {
    const matchesSearch = filters.search
      ? university.name.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesLocation = filters.location
      ? university.location.toLowerCase() === filters.location.toLowerCase()
      : true;
    const matchesDegree = filters.degreeLevel
      ? Array.isArray(university.programs?.[filters.degreeLevel]) &&
        university.programs[filters.degreeLevel].length > 0
      : true;
    return matchesSearch && matchesLocation && matchesDegree;
  });
};

const delay = async <T>(value: T, ms = 150) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const nextId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `uni-${Date.now()}`);

export const getUniversities = async (filters?: UniversityFilters): Promise<University[]> => {
  const data = filterUniversities(readStore(), filters);
  return delay(data);
};

export const getUniversity = async (id: string): Promise<University> => {
  const universities = readStore();
  const university = universities.find((u) => u.id === id);
  if (!university) {
    throw new Error('University not found');
  }
  return delay(university);
};

const normalizeRestrictedCountries = (list?: string[]) =>
  (list ?? [])
    .map((country) => country.trim())
    .filter((country, index, arr) => country && arr.indexOf(country) === index);

export const createUniversity = async (payload: Partial<University>) => {
  if (!payload.name || !payload.portalUrl || !payload.location) {
    throw new Error('Name, portal link, and location are required');
  }
  const universities = readStore();
  const newUniversity: University = {
    id: payload.id ?? nextId(),
    name: payload.name,
    portalUrl: payload.portalUrl,
    location: payload.location,
    overview: payload.overview ?? '',
    fees: payload.fees ?? { application: 0, averageTuition: {} },
    programs: payload.programs ?? { bachelor: [], masters: [], phd: [] },
    scholarships: payload.scholarships ?? { bachelor: [], masters: [], phd: [] },
    restrictedCountries: normalizeRestrictedCountries(payload.restrictedCountries)
  };
  universities.push(newUniversity);
  writeStore(universities);
  return delay(newUniversity);
};

export const updateUniversity = async (id: string, payload: Partial<University>) => {
  const universities = readStore();
  const index = universities.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error('University not found');
  }
  const updated: University = normalizeUniversity({
    ...universities[index],
    ...payload,
    restrictedCountries:
      payload.restrictedCountries !== undefined
        ? normalizeRestrictedCountries(payload.restrictedCountries)
        : universities[index].restrictedCountries ?? [],
    id
  });
  universities[index] = updated;
  writeStore(universities);
  return delay(updated);
};
