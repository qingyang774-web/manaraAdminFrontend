import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { degreeLevels } from '../types/university';
import type { DegreeLevel, University } from '../types/university';
import { deleteUniversity, getUniversities } from '../services/universityService';
import type { UniversityFilters } from '../services/universityService';

const degreeLabels: Record<DegreeLevel, string> = {
  bachelor: 'Bachelor',
  masters: 'Masters',
  phd: 'PhD'
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }
  return `$${value.toLocaleString()}`;
};

function UniversitiesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<UniversityFilters>({});
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let keep = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getUniversities(filters);
        if (!keep) return;
        setUniversities(data);
      } catch (err) {
        if (!keep) return;
        setError(err instanceof Error ? err.message : 'Unable to load universities');
      } finally {
        if (keep) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      keep = false;
    };
  }, [filters]);

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${name}?`);
    if (!confirmed) return;
    try {
      await deleteUniversity(id);
      setUniversities((prev) => prev.filter((uni) => uni.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete university');
    }
  };

  const locationOptions = useMemo(() => {
    const set = new Set(universities.map((uni) => uni.location));
    return Array.from(set).sort();
  }, [universities]);

  const handleFilterChange = <K extends keyof UniversityFilters>(
    key: K,
    value: UniversityFilters[K]
  ) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  return (
    <>
      <section className="card filters-card">
        <div className="filters-header">
          <div>
            <p className="eyebrow">Directory filters</p>
            <h2>Explore partner universities</h2>
          </div>
          <p className="muted">
            Filter by name, location, or degree level to quickly surface the right programs and
            scholarships for candidates.
          </p>
        </div>
        <form className="filters-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Search
            <input
              type="search"
              placeholder="Search by university name"
              value={filters.search ?? ''}
              onChange={(event) => handleFilterChange('search', event.target.value)}
            />
          </label>
          <label>
            Location
            <select
              value={filters.location ?? ''}
              onChange={(event) => handleFilterChange('location', event.target.value)}
            >
              <option value="">All locations</option>
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
          <label>
            Degree level
            <select
              value={filters.degreeLevel ?? ''}
              onChange={(event) => {
                const value = event.target.value as DegreeLevel | '';
                handleFilterChange('degreeLevel', value === '' ? undefined : value);
              }}
            >
              <option value="">All degrees</option>
              {degreeLevels.map((level) => (
                <option key={level} value={level}>
                  {degreeLabels[level]}
                </option>
              ))}
            </select>
          </label>
        </form>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Universities</p>
            <h2>Showing {universities.length} results</h2>
          </div>
          {isLoading && <p className="muted">Refreshing data…</p>}
          {error && <p className="error-text">{error}</p>}
        </div>

        {universities.length === 0 && !isLoading ? (
          <div className="card">
            <p>No universities match the current filters.</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {universities.map((university) => {
              const totalPrograms = degreeLevels.reduce(
                (sum, level) => sum + (university.programs?.[level]?.length ?? 0),
                0
              );
              const totalScholarships = degreeLevels.reduce(
                (sum, level) => sum + (university.scholarships?.[level]?.length ?? 0),
                0
              );
              const goToDetail = () => navigate(`/universities/${university.id}`);
              return (
                <article
                  key={university.id}
                  className="card university-card"
                  role="button"
                  tabIndex={0}
                  onClick={goToDetail}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      goToDetail();
                    }
                  }}
                >
                  <div className="card-header">
                    <div>
                      <h3>{university.name}</h3>
                      <p className="muted">{university.location}</p>
                    </div>
                    <div className="card-actions">
                      <span className="badge">View</span>
                      <button
                        type="button"
                        className="button-danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(university.id, university.name);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="card-body">{university.overview}</p>
                  <div className="card-meta">
                    <div>
                      <p className="muted label">Application fee</p>
                      <strong>{formatCurrency(university.fees?.application)}</strong>
                    </div>
                    <div>
                      <p className="muted label">Programs</p>
                      <strong>{totalPrograms}</strong>
                    </div>
                    <div>
                      <p className="muted label">Scholarships</p>
                      <strong>{totalScholarships}</strong>
                    </div>
                  </div>
                  <div className="card-footer link-inline">Explore profile →</div>
                  {(university.restrictedCountries?.length ?? 0) > 0 && (
                    <p className="restricted-note">
                      Restricted: {university.restrictedCountries!.join(', ')}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default UniversitiesPage;

