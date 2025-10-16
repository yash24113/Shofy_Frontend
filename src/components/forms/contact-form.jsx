'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  useCreateContactDraftMutation,
  useUpdateContactDraftMutation,
  useGetContactDraftQuery,
  useGetOfficeInfoQuery,
} from '@/redux/features/contactApi';

const DEFAULT_DRAFT_KEY = 'contact_draft_id';
const DEFAULT_STORAGE_KEY = 'fabricpro_contact_form';

function mapToBackend(f) {
  return {
    companyName: f.companyName,
    contactPerson: f.contactPerson,
    email: f.email,
    phoneNumber: f.phone,
    businessType: f.businessType,
    annualFabricVolume: f.annualVolume,
    primaryMarkets: f.primaryMarkets,
    fabricTypesOfInterest: f.fabricTypes,
    specificationsRequirements: f.specifications,
    timeline: f.timeline,
    additionalMessage: f.message,
  };
}

const EMPTY = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  businessType: '',
  annualVolume: '',
  primaryMarkets: '',
  fabricTypes: [],
  specifications: '',
  timeline: '',
  message: '',
};

export default function ContactForm({ onSuccess, draftKey = DEFAULT_DRAFT_KEY, storageKey = DEFAULT_STORAGE_KEY }) {
  // Initial load
  const initialSnapshot = (() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [formData, setFormData] = useState(() => ({
    ...EMPTY,
    ...(initialSnapshot?.formData ?? {}),
  }));
  const [currentStep, setCurrentStep] = useState(() => {
    const s = Number(initialSnapshot?.currentStep);
    return s >= 1 && s <= 3 ? s : 1;
  });
  const [draftId, setDraftId] = useState(() => initialSnapshot?.draftId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const saveTimer = useRef(null);
  const isSavingRef = useRef(false);
  const honeypotRef = useRef(null);
  const hasHydrated = useRef(false);

  const [createDraft] = useCreateContactDraftMutation();
  const [updateDraft] = useUpdateContactDraftMutation();
  const { data: hydrated } = useGetContactDraftQuery(draftId, { skip: !draftId });
  useGetOfficeInfoQuery(undefined, { skip: false });

  useEffect(() => {
    if (hydrated?.data && !hasHydrated.current) {
      const d = hydrated.data;
      setFormData({
        companyName: d.companyName ?? '',
        contactPerson: d.contactPerson ?? '',
        email: d.email ?? '',
        phone: d.phoneNumber ?? '',
        businessType: d.businessType ?? '',
        annualVolume: d.annualFabricVolume ?? '',
        primaryMarkets: d.primaryMarkets ?? '',
        fabricTypes: Array.isArray(d.fabricTypesOfInterest) ? d.fabricTypesOfInterest : [],
        specifications: d.specificationsRequirements ?? '',
        timeline: d.timeline ?? '',
        message: d.additionalMessage ?? '',
      });
      hasHydrated.current = true;
    }
  }, [hydrated]);

  const persistDraft = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      const payload = mapToBackend(formData);
      let newId = draftId;

      if (!draftId) {
        const res = await createDraft(payload).unwrap();
        newId = res?.data?._id;
        if (newId) {
          setDraftId(newId);
          localStorage.setItem(draftKey, newId);
        }
      } else {
        await updateDraft({ id: draftId, payload }).unwrap();
      }

      localStorage.setItem(storageKey, JSON.stringify({
        formData,
        currentStep,
        draftId: newId,
      }));
    } catch (e) {
      console.error('Autosave error:', e);
    } finally {
      isSavingRef.current = false;
    }
  }, [formData, draftId, createDraft, updateDraft, draftKey, storageKey, currentStep]);

  const scheduleAutosave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persistDraft(), 600);
  }, [persistDraft]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    scheduleAutosave();
  };

  const toggleFabric = (fabric) => {
    setFormData((prev) => {
      const exists = prev.fabricTypes.includes(fabric);
      const next = exists ? prev.fabricTypes.filter((x) => x !== fabric) : [...prev.fabricTypes, fabric];
      return { ...prev, fabricTypes: next };
    });
    scheduleAutosave();
  };

  const goNext = () => {
    setCurrentStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };
  const goToStep = (step) => {
    if (step < 1 || step > 3) return;
    setCurrentStep(step);
  };

  const resetAll = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(draftKey);
    setFormData({ ...EMPTY });
    setCurrentStep(1);
    setDraftId('');
    hasHydrated.current = false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypotRef.current?.value) {
      alert('Spam detected');
      return;
    }
    setIsSubmitting(true);
    try {
      clearTimeout(saveTimer.current);
      await persistDraft();
      resetAll();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 1200);
    } catch (err) {
      console.error('Submission error', err);
      alert('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="cf-safe">
        <div className="card success">
          <div className="tick">✓</div>
          <h3>Request Submitted</h3>
          <p>Thank you! We’ll contact you soon.</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="cf-safe">
      <div className="card">
        <div className="progress-bar">
          <div className={`circle ${currentStep >= 1 ? 'active' : ''}`} onClick={() => goToStep(1)}>1</div>
          <div className="line full"></div>
          <div className={`circle ${currentStep >= 2 ? 'active' : ''}`} onClick={() => goToStep(2)}>2</div>
          <div className="line full"></div>
          <div className={`circle ${currentStep >= 3 ? 'active' : ''}`} onClick={() => goToStep(3)}>3</div>
        </div>
        <div className="step-label">Step {currentStep} of 3</div>
        <form className={`form ${shake ? 'shake' : ''}`} onSubmit={handleSubmit} noValidate>
          <div style={{ visibility: 'hidden', height: 0 }}>
            <input ref={honeypotRef} name="hp" type="text" autoComplete="off" />
          </div>

          {currentStep === 1 && (
            <div className="step-content">
              <InputField
                label="Company Name"
                name="companyName"
                placeholder="Your company name"
                value={formData.companyName}
                onChange={handleInputChange}
              />
              <InputField
                label="Contact Person"
                name="contactPerson"
                placeholder="Your full name"
                value={formData.contactPerson}
                onChange={handleInputChange}
              />
              <InputField
                label="Email Address"
                name="email"
                type="email"
                placeholder="your@company.com"
                value={formData.email}
                onChange={handleInputChange}
              />
              <InputField
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
              />
              <div className="actions">
                <button type="button" className="btn primary" onClick={goNext}>
                  Next Step
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content">
              <InputSelect
                label="Business Type"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                placeholder="Select business type"
                options={[
                  ['', 'Select business type'],
                  ['garment-manufacturer', 'Garment Manufacturer'],
                  ['clothing-retailer', 'Clothing Retailer'],
                  ['fabric-importer', 'Fabric Importer'],
                  ['trading-company', 'Trading Company'],
                  ['other', 'Other'],
                ]}
              />
              <InputSelect
                label="Annual Fabric Volume"
                name="annualVolume"
                value={formData.annualVolume}
                onChange={handleInputChange}
                placeholder="Select volume range"
                options={[
                  ['', 'Select volume range'],
                  ['under-10k', 'Under 10,000 m'],
                  ['10k-50k', '10,000–50,000 m'],
                  ['50k-100k', '50,000–100,000 m'],
                  ['100k-500k', '100,000–500,000 m'],
                  ['over-500k', '500,000+ m'],
                ]}
              />
              <InputField
                label="Primary Markets"
                name="primaryMarkets"
                placeholder="e.g., North America, Europe, Asia"
                value={formData.primaryMarkets}
                onChange={handleInputChange}
              />
              <div className="fabric-block">
                <span>Fabric Types of Interest</span>
                <div className="pill-group">
                  {['Cotton','Silk','Polyester','Blends','Linen','Wool','Technical','Denim'].map((f) => (
                    <button
                      type="button"
                      key={f}
                      className={`pill ${formData.fabricTypes.includes(f) ? 'active' : ''}`}
                      onClick={() => toggleFabric(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="actions">
                <button type="button" className="btn ghost" onClick={goBack}>
                  Previous
                </button>
                <button type="button" className="btn primary" onClick={goNext}>
                  Next Step
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content">
              <InputTextArea
                label="Specifications & Requirements"
                name="specifications"
                placeholder="Weight, width, color requirements, etc."
                value={formData.specifications}
                onChange={handleInputChange}
              />
              <InputTextArea
                label="Additional Message"
                name="message"
                placeholder="Any additional requirements or questions"
                value={formData.message}
                onChange={handleInputChange}
              />
              <InputSelect
                label="Timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                placeholder="Select timeline"
                options={[
                  ['', 'Select timeline'],
                  ['immediate', 'Within 1 month'],
                  ['1-3-months', '1–3 months'],
                  ['3-6-months', '3–6 months'],
                  ['6-months-plus', '6+ months'],
                ]}
              />
              <div className="actions">
                <button type="button" className="btn ghost" onClick={goBack}>
                  Previous
                </button>
                <button type="submit" className="btn primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

// Subcomponents

function InputField({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="input-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function InputSelect({ label, name, value, onChange, options, placeholder }) {
  return (
    <div className="input-group">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
      >
        {options.map(([v, text]) => (
          <option key={v + text} value={v}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputTextArea({ label, name, value, onChange, placeholder }) {
  return (
    <div className="input-group">
      <label htmlFor={name}>{label}</label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={4}
      />
    </div>
  );
}

// CSS styling
const styles = `
:root {
  --blue: #2563eb;
  --blue-light: #cfe8ff;
  --gray-border: #ddd;
  --gray-light: #f7f9fc;
  --text: #1f2937;
  --text-light: #6b7280;
  --card-bg: #ffffff;
}

.cf-safe {
 
  padding: 60px 20px;
  display: flex;
  justify-content: center;
}
.card {
  background: var(--card-bg);
  border: 1px solid var(--gray-border);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.success {
  text-align: center;
  padding: 48px;
}
.tick {
  font-size: 48px;
  color: var(--blue);
  margin-bottom: 16px;
}

.progress-bar {
  display: none;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
}
.progress-bar .line.full {
  position: absolute;
  top: 50%;
  left: 15%;
  right: 15%;
  height: 4px;
  background: var(--blue-light);
  transform: translateY(-50%);
  z-index: 1;
}
.progress-bar .circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--gray-border);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}
.progress-bar .circle.active {
  background: var(--blue);
  color: #fff;
}

.step-label {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 16px;
}

.form {
  width: 100%;
}
.step-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.input-group {
  display: flex;
  flex-direction: column;
}
.input-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}
.input-group input,
.input-group select,
input-group textarea {
  border: 1px solid var(--gray-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 15px;
  color: var(--text);
  background: #fff;
  transition: border-color .2s;
}
.input-group input:focus,
.input-group select:focus,
.input-group textarea:focus {
  outline: none;
  border-color: var(--blue);
}
.fabric-block {
  display: flex;
  flex-direction: column;
}
.fabric-block .pill-group {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.pill {
  border: 1px solid var(--gray-border);
  border-radius: 999px;
  padding: 8px 14px;
  background: #fff;
  color: var(--text);
  cursor: pointer;
  transition: background .2s;
}
.pill:hover {
  background: var(--gray-light);
}
.pill.active {
  background: var(--blue);
  color: #fff;
  border-color: var(--blue);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background .2s;
}
.btn.primary {
  background: var(--blue);
  color: #fff;
}
.btn.primary:hover {
  background: #1e4fb8;
}
.btn.ghost {
  background: #fff;
  color: var(--text);
  border: 1px solid var(--gray-border);
}
.btn.ghost:hover {
  background: var(--blue-light);
  color: var(--blue);
}

.shake {
  animation: shakeAnim 0.5s ease;
}
@keyframes shakeAnim {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}

@media (max-width: 576px) {
  .card { padding: 24px; }
  .progress-bar .circle { width: 24px; height: 24px; }
  .step-label { font-size: 13px; }
}
`;

