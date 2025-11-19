import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { degreeLevels } from '../types/university';
import type { DegreeLevel, University } from '../types/university';
import { getUniversity } from '../services/universityService';

const degreeLabels: Record<DegreeLevel, string> = {
  bachelor: 'Bachelor',
  masters: 'Masters',
  phd: 'PhD'
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `$${value.toLocaleString()}`;
};

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="pill">{children}</span>
);

function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [university, setUniversity] = useState<University | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }
    let keep = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await getUniversity(id);
        if (!keep) return;
        setUniversity(data);
      } catch (err) {
        if (!keep) return;
        setError(err instanceof Error ? err.message : 'Unable to load university');
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
  }, [id, navigate]);

  const highlightStats = useMemo(() => {
    if (!university) return [];
    return [
      {
        label: 'Application fee',
        value: formatCurrency(university.fees?.application)
      },
      {
        label: 'Bachelor tuition',
        value: formatCurrency(university.fees?.averageTuition?.bachelor)
      },
      {
        label: 'Masters tuition',
        value: formatCurrency(university.fees?.averageTuition?.masters)
      },
      {
        label: 'PhD tuition',
        value: formatCurrency(university.fees?.averageTuition?.phd)
      }
    ];
  }, [university]);

  if (isLoading) {
    return (
      <section className="card detail-shell">
        <p className="muted">Loading university details…</p>
      </section>
    );
  }

  if (error || !university) {
    return (
      <section className="card detail-shell">
        <p className="error-text">{error ?? 'University not found.'}</p>
        <button className="button-secondary" onClick={() => navigate(-1)}>
          Go back
        </button>
      </section>
    );
  }

  return (
    <div className="detail-shell">
      <div className="detail-hero card">
        <div className="hero-top">
          <div>
            <Link to="/" className="link inline">
              ← Back to directory
            </Link>
            <p className="eyebrow">University profile</p>
            <h1>{university.name}</h1>
            <p className="muted">{university.location}</p>
          </div>
          <div className="hero-actions">
            <button
              className="button-secondary"
              onClick={() => navigate('/admin', { state: { editId: university.id } })}
            >
              Edit in Admin
            </button>
            <a
              className="button-primary"
              href={university.portalUrl}
              target="_blank"
              rel="noreferrer"
            >
              Visit portal
            </a>
          </div>
        </div>
        {university.overview && <p className="hero-overview">{university.overview}</p>}
        <div className="stat-grid">
          {highlightStats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="muted">{stat.label}</p>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {degreeLevels.map((level) => {
        const programs = university.programs?.[level] ?? [];
        const scholarships = university.scholarships?.[level] ?? [];
        return (
          <section key={level} className="card detail-section">
            <div className="section-header">
              <div>
                <span className="badge">{degreeLabels[level]}</span>
                <h2>{degreeLabels[level]} opportunities</h2>
              </div>
              <p className="muted">
                {programs.length} programs · {scholarships.length} scholarships
              </p>
            </div>
            <div className="pill-row">
              {programs.map((program) => (
                <Pill key={`${level}-${program.name}`}>{program.name}</Pill>
              ))}
            </div>
            <div className="degree-detail-grid">
              <div>
                <h3>Programs</h3>
                {programs.length === 0 ? (
                  <p className="muted">No programs have been added yet.</p>
                ) : (
                  <div className="table-like">
                    <header>
                      <span>Name</span>
                      <span>Duration</span>
                      <span>Delivery</span>
                    </header>
                    {programs.map((program) => (
                      <div key={`${level}-program-${program.name}`} className="row">
                        <span>{program.name}</span>
                        <span>{program.duration || 'N/A'}</span>
                        <span>{program.delivery || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3>Scholarships</h3>
                {scholarships.length === 0 ? (
                  <p className="muted">Scholarship data is not available.</p>
                ) : (
                  <div className="scholarship-grid">
                    {scholarships.map((scholarship) => (
                      <div
                        key={`${level}-scholarship-${scholarship.name}`}
                        className="scholarship-card"
                      >
                        <div className="scholarship-header">
                          <strong>{scholarship.name}</strong>
                          <span>{scholarship.amount || '—'}</span>
                        </div>
                        <p className="muted">{scholarship.eligibility}</p>
                        <p className="deadline">Deadline: {scholarship.deadline || 'Rolling'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default UniversityDetailPage;

