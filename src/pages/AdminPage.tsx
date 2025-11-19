import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { degreeLevels } from '../types/university';
import type { DegreeLevel, Program, Scholarship, University } from '../types/university';
import {
  createUniversity,
  getUniversities,
  updateUniversity
} from '../services/universityService';

type EditableUniversity = Omit<University, 'id'> & { id?: string };

const emptyPrograms = (): Record<DegreeLevel, Program[]> =>
  degreeLevels.reduce(
    (acc, level) => {
      acc[level] = [];
      return acc;
    },
    {} as Record<DegreeLevel, Program[]>
  );

const emptyScholarships = (): Record<DegreeLevel, Scholarship[]> =>
  degreeLevels.reduce(
    (acc, level) => {
      acc[level] = [];
      return acc;
    },
    {} as Record<DegreeLevel, Scholarship[]>
  );

const createDefaultForm = (): EditableUniversity => ({
  id: undefined,
  name: '',
  portalUrl: '',
  location: '',
  overview: '',
  fees: {
    application: 0,
    averageTuition: {}
  },
  programs: emptyPrograms(),
  scholarships: emptyScholarships()
});

const toEditable = (university: University): EditableUniversity => ({
  ...university,
  overview: university.overview ?? '',
  fees: {
    application: university.fees?.application ?? 0,
    averageTuition: { ...(university.fees?.averageTuition ?? {}) }
  },
  programs: degreeLevels.reduce(
    (acc, level) => {
      acc[level] = [...(university.programs?.[level] ?? [])];
      return acc;
    },
    {} as Record<DegreeLevel, Program[]>
  ),
  scholarships: degreeLevels.reduce(
    (acc, level) => {
      acc[level] = [...(university.scholarships?.[level] ?? [])];
      return acc;
    },
    {} as Record<DegreeLevel, Scholarship[]>
  )
});

const degreeLabels: Record<DegreeLevel, string> = {
  bachelor: 'Bachelor',
  masters: 'Masters',
  phd: 'PhD'
};

const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingEditId = (location.state as { editId?: string } | null)?.editId;
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedId, setSelectedId] = useState<'new' | string>('new');
  const [formState, setFormState] = useState<EditableUniversity>(createDefaultForm());
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const loadUniversities = useCallback(async () => {
    try {
      const data = await getUniversities();
      setUniversities(data);
      return data;
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load universities.'
      });
      return [];
    }
  }, []);

  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  useEffect(() => {
    if (!pendingEditId || universities.length === 0) {
      return;
    }
    const match = universities.find((uni) => uni.id === pendingEditId);
    if (match) {
      setSelectedId(match.id);
      setFormState(toEditable(match));
      navigate('.', { replace: true, state: null });
    }
  }, [pendingEditId, universities, navigate]);

  const selectedUniversityName = useMemo(
    () => universities.find((uni) => uni.id === selectedId)?.name ?? 'New university',
    [universities, selectedId]
  );

  const updateForm = (updates: Partial<EditableUniversity>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const handleSelectChange = (value: string) => {
    if (value === 'new') {
      setSelectedId('new');
      setFormState(createDefaultForm());
      return;
    }
    const selection = universities.find((uni) => uni.id === value);
    if (selection) {
      setSelectedId(selection.id);
      setFormState(toEditable(selection));
    }
  };

  const handleProgramChange = (
    level: DegreeLevel,
    index: number,
    field: keyof Program,
    value: string
  ) => {
    setFormState((prev) => {
      const programs = [...prev.programs[level]];
      programs[index] = { ...programs[index], [field]: value };
      return {
        ...prev,
        programs: { ...prev.programs, [level]: programs }
      };
    });
  };

  const handleScholarshipChange = (
    level: DegreeLevel,
    index: number,
    field: keyof Scholarship,
    value: string
  ) => {
    setFormState((prev) => {
      const scholarships = [...prev.scholarships[level]];
      scholarships[index] = { ...scholarships[index], [field]: value };
      return {
        ...prev,
        scholarships: { ...prev.scholarships, [level]: scholarships }
      };
    });
  };

  const addProgram = (level: DegreeLevel) => {
    setFormState((prev) => ({
      ...prev,
      programs: {
        ...prev.programs,
        [level]: [...prev.programs[level], { name: '', duration: '', delivery: '' }]
      }
    }));
  };

  const removeProgram = (level: DegreeLevel, index: number) => {
    setFormState((prev) => {
      const programs = prev.programs[level].filter((_, idx) => idx !== index);
      return {
        ...prev,
        programs: { ...prev.programs, [level]: programs }
      };
    });
  };

  const addScholarship = (level: DegreeLevel) => {
    setFormState((prev) => ({
      ...prev,
      scholarships: {
        ...prev.scholarships,
        [level]: [
          ...prev.scholarships[level],
          { name: '', amount: '', eligibility: '', deadline: '' }
        ]
      }
    }));
  };

  const removeScholarship = (level: DegreeLevel, index: number) => {
    setFormState((prev) => {
      const scholarships = prev.scholarships[level].filter((_, idx) => idx !== index);
      return {
        ...prev,
        scholarships: { ...prev.scholarships, [level]: scholarships }
      };
    });
  };

  const sanitizePayload = (): EditableUniversity => {
    const cleanPrograms = degreeLevels.reduce((acc, level) => {
      acc[level] = formState.programs[level].filter((program) => program.name.trim());
      return acc;
    }, {} as Record<DegreeLevel, Program[]>);

    const cleanScholarships = degreeLevels.reduce((acc, level) => {
      acc[level] = formState.scholarships[level].filter((scholarship) => scholarship.name.trim());
      return acc;
    }, {} as Record<DegreeLevel, Scholarship[]>);

    const averageTuition = Object.fromEntries(
      Object.entries(formState.fees.averageTuition ?? {}).filter(
        ([, value]) => value !== undefined && value !== null && !Number.isNaN(value)
      )
    ) as Partial<Record<DegreeLevel, number>>;

    return {
      ...formState,
      name: formState.name.trim(),
      portalUrl: formState.portalUrl.trim(),
      location: formState.location.trim(),
      overview: formState.overview?.trim(),
      fees: {
        application: Number(formState.fees.application) || 0,
        averageTuition
      },
      programs: cleanPrograms,
      scholarships: cleanScholarships
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name || !formState.portalUrl || !formState.location) {
      setStatus({ type: 'error', message: 'Name, portal link, and location are required.' });
      return;
    }

    try {
      setIsSaving(true);
      setStatus(null);
      const payload = sanitizePayload();
      const saved =
        selectedId === 'new'
          ? await createUniversity(payload)
          : await updateUniversity(selectedId, payload);

      await loadUniversities();
      setSelectedId(saved.id);
      setFormState(toEditable(saved));
      setStatus({
        type: 'success',
        message:
          selectedId === 'new'
            ? 'University added to the directory.'
            : 'University details updated.'
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save university.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="card">
      <header className="form-header">
        <div>
          <p className="eyebrow">Admin console</p>
          <h2>{selectedUniversityName}</h2>
        </div>
        <div className="form-controls">
          <label>
            Load record
            <select value={selectedId} onChange={(e) => handleSelectChange(e.target.value)}>
              <option value="new">+ Add new university</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        {status && (
          <div className={`status-banner ${status.type === 'success' ? 'success' : 'error'}`}>
            {status.message}
          </div>
        )}

        <div className="grid">
          <label>
            University name
            <input
              value={formState.name}
              onChange={(event) => updateForm({ name: event.target.value })}
              placeholder="e.g., Stanford University"
              required
            />
          </label>

          <label>
            Portal link
            <input
              value={formState.portalUrl}
              onChange={(event) => updateForm({ portalUrl: event.target.value })}
              placeholder="https://"
              required
            />
          </label>

          <label>
            Location
            <input
              value={formState.location}
              onChange={(event) => updateForm({ location: event.target.value })}
              placeholder="City, Country"
              required
            />
          </label>

          <label>
            Application fee (USD)
            <input
              type="number"
              min={0}
              value={formState.fees.application}
              onChange={(event) =>
                updateForm({
                  fees: {
                    ...formState.fees,
                    application: Number(event.target.value)
                  }
                })
              }
            />
          </label>
        </div>

        <label>
          Overview
          <textarea
            value={formState.overview}
            onChange={(event) => updateForm({ overview: event.target.value })}
            placeholder="What makes this university unique for Manara Scholars?"
          />
        </label>

        <section>
          <h3>Average tuition by degree</h3>
          <div className="grid grid-3">
            {degreeLevels.map((level) => (
              <label key={level}>
                {degreeLabels[level]}
                <input
                  type="number"
                  min={0}
                  value={formState.fees.averageTuition?.[level] ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormState((prev) => ({
                      ...prev,
                      fees: {
                        ...prev.fees,
                        averageTuition: {
                          ...prev.fees.averageTuition,
                          [level]: value === '' ? undefined : Number(value)
                        }
                      }
                    }));
                  }}
                />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3>Programs & scholarships</h3>
          <p className="muted">
            Track every bachelor, masters, and PhD opportunity offered to Manara Scholars.
          </p>

          {degreeLevels.map((level) => (
            <div key={level} className="degree-editor">
              <div className="degree-title">
                <span className="badge">{degreeLabels[level]}</span>
                <div className="editor-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => addProgram(level)}
                  >
                    + Program
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => addScholarship(level)}
                  >
                    + Scholarship
                  </button>
                </div>
              </div>

              <div className="degree-editor-grid">
                <div>
                  <h4>Programs</h4>
                  {formState.programs[level].length === 0 ? (
                    <p className="muted">No programs yet.</p>
                  ) : (
                    formState.programs[level].map((program, index) => (
                      <div key={`${level}-program-${index}`} className="inline-card">
                        <div className="inline-card-grid">
                          <label>
                            Name
                            <input
                              value={program.name}
                              onChange={(event) =>
                                handleProgramChange(level, index, 'name', event.target.value)
                              }
                            />
                          </label>
                          <label>
                            Duration
                            <input
                              value={program.duration}
                              onChange={(event) =>
                                handleProgramChange(level, index, 'duration', event.target.value)
                              }
                            />
                          </label>
                          <label>
                            Delivery
                            <input
                              value={program.delivery}
                              onChange={(event) =>
                                handleProgramChange(level, index, 'delivery', event.target.value)
                              }
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          className="link danger"
                          onClick={() => removeProgram(level, index)}
                        >
                          Remove program
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <h4>Scholarships</h4>
                  {formState.scholarships[level].length === 0 ? (
                    <p className="muted">No scholarships yet.</p>
                  ) : (
                    formState.scholarships[level].map((scholarship, index) => (
                      <div key={`${level}-scholarship-${index}`} className="inline-card">
                        <div className="inline-card-grid">
                          <label>
                            Name
                            <input
                              value={scholarship.name}
                              onChange={(event) =>
                                handleScholarshipChange(level, index, 'name', event.target.value)
                              }
                            />
                          </label>
                          <label>
                            Amount
                            <input
                              value={scholarship.amount}
                              onChange={(event) =>
                                handleScholarshipChange(level, index, 'amount', event.target.value)
                              }
                            />
                          </label>
                          <label>
                            Eligibility
                            <input
                              value={scholarship.eligibility}
                              onChange={(event) =>
                                handleScholarshipChange(
                                  level,
                                  index,
                                  'eligibility',
                                  event.target.value
                                )
                              }
                            />
                          </label>
                          <label>
                            Deadline
                            <input
                              value={scholarship.deadline}
                              onChange={(event) =>
                                handleScholarshipChange(level, index, 'deadline', event.target.value)
                              }
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          className="link danger"
                          onClick={() => removeScholarship(level, index)}
                        >
                          Remove scholarship
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="form-actions">
          <button type="submit" className="button-primary" disabled={isSaving}>
            {isSaving
              ? 'Saving…'
              : selectedId === 'new'
                ? 'Add university'
                : 'Update university'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AdminPage;

