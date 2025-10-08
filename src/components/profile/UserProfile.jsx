'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { FaEdit, FaTrash } from 'react-icons/fa';

import {
  useGetSessionInfoQuery,
  useUpdateProfileMutation,
  useLogoutUserMutation,
} from '@/redux/features/auth/authApi';

import { notifyError, notifySuccess } from '@/utils/toast';
import styles from './UserProfile.module.css';

/* ---------------- helpers ---------------- */
const pickInitialUser = (reduxUser) => {
  if (reduxUser) return reduxUser;
  const cookie = Cookies.get('userInfo');
  if (!cookie) return null;
  try { return JSON.parse(cookie)?.user || null; } catch { return null; }
};

const readUserInfoCookie = () => {
  try { return JSON.parse(Cookies.get('userInfo') || '{}'); } catch { return {}; }
};
const writeUserInfoCookiePreserving = (updatedUser) => {
  const prev = readUserInfoCookie();
  Cookies.set('userInfo', JSON.stringify({ ...prev, user: updatedUser }), { expires: 0.5 });
};

const initials = (name = '') =>
  name.split(' ').filter(Boolean).map(s => s[0]?.toUpperCase()).slice(0,2).join('') || 'U';

const onlyDigits = (s='') => (s || '').replace(/\D+/g, '');
const normalizeDial = (s='') => (s ? (s.startsWith('+') ? s : `+${s}`) : '');

const cleanString = (v) => (typeof v === 'string' ? v.trim() : v);

/** Return an object of only changed keys vs baseline, skipping undefined.
 *  allowEmptyKeys: keys that can be sent as '' intentionally. */
const diffPayload = (next, base, allowEmptyKeys = new Set()) => {
  const out = {};
  Object.keys(next).forEach((k) => {
    const nv = next[k];
    const bv = base?.[k];
    const same = (cleanString(nv) === cleanString(bv));
    if (same) return;
    if (nv === undefined) return;
    if (nv === '' && !allowEmptyKeys.has(k)) return;
    out[k] = nv;
  });
  return out;
};

/* Validation */
const editSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  organisation: Yup.string().nullable(),
  phone: Yup.string().nullable(),   // stored as +<dial><digits>
  address: Yup.string().nullable(),
  city: Yup.string().nullable(),
  state: Yup.string().nullable(),
  country: Yup.string().nullable(),
  pincode: Yup.string().nullable(),
});

export default function UserProfile() {
  const authUser = useSelector((s) => s?.auth?.user);
  const cookieUser = useMemo(() => pickInitialUser(authUser), [authUser]);
  const derivedUserId = (authUser?._id || cookieUser?._id);

  // Persist userId to localStorage as soon as we know it
  useEffect(() => {
    if (derivedUserId) localStorage.setItem('userId', String(derivedUserId));
  }, [derivedUserId]);

  // Also read a fallback userId from localStorage (prevents "Not logged in" flash)
  const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const userId = derivedUserId || storedUserId || null;

  const { data: sessionData, refetch: refetchSession } =
    useGetSessionInfoQuery({ userId }, {
      skip: !userId,
      refetchOnFocus: true,
      refetchOnReconnect: true
    });

  // optimistic local user
  const [localUser, setLocalUser] = useState(null);
  const user = localUser || authUser || sessionData?.session?.user || cookieUser || {};

  const [logoutUser] = useLogoutUserMutation();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();

  const [active, setActive] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState(null);

  /* Countries + dial codes */
  // [{cca2, name, dial, flagPng}]
  const [countries, setCountries] = useState([]);
  const [dialSelected, setDialSelected] = useState(''); // +91
  const [phoneLocal, setPhoneLocal] = useState('');     // digits only

  /* Dependent state/city */
  const [countryName, setCountryName] = useState(user?.country || '');
  const [states, setStates] = useState([]);             // [{name}]
  const [stateName, setStateName] = useState(user?.state || '');
  const [cities, setCities] = useState([]);             // [string]
  const [cityName, setCityName] = useState(user?.city || '');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,cca2,flags');
        const raw = await res.json();
        const list = (raw || [])
          .map(r => {
            const root = r?.idd?.root || '';
            const suffixes = r?.idd?.suffixes || [];
            const dial = root && suffixes && suffixes.length ? `${root}${suffixes[0]}` : root || '';
            return {
              cca2: r?.cca2 || '',
              name: r?.name?.common || '',
              dial: dial || '',
              flagPng: r?.flags?.png || '',
            };
          })
          .filter(x => x.cca2 && x.name && x.dial && x.flagPng)
          .sort((a,b) => a.name.localeCompare(b.name));
        if (mounted) setCountries(list);
      } catch {
        setCountries([]); // no fallback
      }
    })();
    return () => { mounted = false; };
  }, []);

  // fetch states when country changes
  useEffect(() => {
    let abort = false;
    (async () => {
      if (!countryName) { setStates([]); setStateName(''); setCities([]); setCityName(''); return; }
      try {
        const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: countryName }),
        });
        const json = await res.json();
        const list = json?.data?.states || [];
        if (!abort) {
          setStates(list);
          // if selected state doesn't belong to new country, clear it
          if (!list.find(s => s.name === stateName)) {
            setStateName('');
            setCities([]);
            setCityName('');
          }
        }
      } catch {
        if (!abort) { setStates([]); setStateName(''); setCities([]); setCityName(''); }
      }
    })();
    return () => { abort = true; };
  }, [countryName]);

  // fetch cities when state changes
  useEffect(() => {
    let abort = false;
    (async () => {
      if (!countryName || !stateName) { setCities([]); setCityName(''); return; }
      try {
        const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: countryName, state: stateName }),
        });
        const json = await res.json();
        const list = json?.data || [];
        if (!abort) {
          setCities(list);
          if (!list.includes(cityName)) setCityName('');
        }
      } catch {
        if (!abort) { setCities([]); setCityName(''); }
      }
    })();
    return () => { abort = true; };
  }, [countryName, stateName]);

  // parse saved phone -> (dialSelected, phoneLocal)
  useEffect(() => {
    const existing = String(user?.phone || '').trim();
    if (!countries.length) return;
    if (existing.startsWith('+')) {
      const match = countries
        .filter(c => existing.startsWith(c.dial))
        .sort((a,b) => b.dial.length - a.dial.length)[0];
      if (match) {
        setDialSelected(match.dial);
        setPhoneLocal(onlyDigits(existing.slice(match.dial.length)));
        return;
      }
    }
    setDialSelected('');
    setPhoneLocal('');
  }, [user?.phone, countries]);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(editSchema),
    defaultValues: {
      name:         user?.name || '',
      email:        user?.email || '',
      organisation: user?.organisation || '',
      phone:        user?.phone || '',
      address:      user?.address || '',
      city:         user?.city || '',
      state:        user?.state || '',
      country:      user?.country || '',
      pincode:      user?.pincode || '',
    },
  });

  // sync when user changes
  useEffect(() => {
    reset({
      name:         user?.name || '',
      email:        user?.email || '',
      organisation: user?.organisation || '',
      phone:        user?.phone || '',
      address:      user?.address || '',
      city:         user?.city || '',
      state:        user?.state || '',
      country:      user?.country || '',
      pincode:      user?.pincode || '',
    });
    setAvatarPreview(user?.avatarUrl || user?.avatar || null);
    setCountryName(user?.country || '');
    setStateName(user?.state || '');
    setCityName(user?.city || '');
  }, [user, reset]);

  // keep hidden phone in sync
  useEffect(() => {
    const composed = (dialSelected && phoneLocal)
      ? `${normalizeDial(dialSelected)}${onlyDigits(phoneLocal)}`
      : (user?.phone || '');
    setValue('phone', composed, { shouldValidate: false, shouldDirty: true });
  }, [dialSelected, phoneLocal, setValue]);

  const onPickAvatar = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    // guard: if still no userId, don't break UI
    if (!userId) {
      notifyError('Cannot update profile: user not identified.');
      return;
    }

    const composedPhone = (dialSelected && phoneLocal)
      ? `${normalizeDial(dialSelected)}${onlyDigits(phoneLocal)}`
      : (data.phone || '');

    const candidate = {
      ...user,
      ...data,
      phone: composedPhone || user?.phone || '',
      country: countryName || '',
      state: stateName || '',
      city: cityName || '',
    };

    if (avatarPreview && avatarPreview !== (user?.avatarUrl || user?.avatar)) {
      candidate.avatar = avatarPreview;
    }

    const changed = diffPayload(
      {
        name: cleanString(candidate.name ?? ''),
        email: cleanString(candidate.email ?? ''),
        organisation: cleanString(candidate.organisation ?? ''),
        phone: cleanString(candidate.phone ?? ''),
        address: cleanString(candidate.address ?? ''),
        city: cleanString(candidate.city ?? ''),
        state: cleanString(candidate.state ?? ''),
        country: cleanString(candidate.country ?? ''),
        pincode: cleanString(candidate.pincode ?? ''),
        avatar: candidate.avatar,
      },
      user,
      new Set(['organisation','address','city','state','country','pincode'])
    );

    if (!Object.keys(changed).length) {
      notifySuccess('Nothing to update');
      setActive('profile');
      return;
    }

    let updatedResp = null;
    try {
      updatedResp = await updateProfile({ id: userId, ...changed }).unwrap();
    } catch (e1) {
      try {
        updatedResp = await updateProfile({ id: userId, body: changed }).unwrap();
      } catch (e2) {
        const msg = e2?.data?.message || e1?.data?.message || e2?.error || e1?.error || 'Update failed';
        notifyError(msg);
        return;
      }
    }

    const updatedUser = updatedResp?.user || updatedResp || { ...user, ...changed };

    setLocalUser(updatedUser);
    reset({
      name:         updatedUser?.name || '',
      email:        updatedUser?.email || '',
      organisation: updatedUser?.organisation || '',
      phone:        updatedUser?.phone || '',
      address:      updatedUser?.address || '',
      city:         updatedUser?.city || '',
      state:        updatedUser?.state || '',
      country:      updatedUser?.country || '',
      pincode:      updatedUser?.pincode || '',
    });
    setAvatarPreview(updatedUser?.avatarUrl || updatedUser?.avatar || null);

    try { writeUserInfoCookiePreserving(updatedUser); }catch(err) {console.log('Refetch session failed', err);}

    try {
      const p = refetchSession?.();
      if (p && typeof p.then === 'function') await p;
    } catch(err) {console.log('Refetch session failed', err);}

    notifySuccess('Profile updated');
    setActive('profile');
  };

  const handleLogout = async () => {
    try {
      await logoutUser({ userId }).unwrap();
      Cookies.remove('userInfo');
      window.location.href = '/login';
    } catch (err) {
      notifyError(err?.data?.message || 'Logout failed');
    }
  };

  /* ---- Derived values for read-only display ---- */
  const selectedDialObj = countries.find(c => c.dial === dialSelected);
  const derivedPrettyPhone = (() => {
    const raw = String(user?.phone || '').trim();
    if (!raw) return '—';
    if (raw.startsWith('+')) return raw;
    if (dialSelected && phoneLocal) return `${normalizeDial(dialSelected)}${onlyDigits(phoneLocal)}`;
    return raw;
  })();

  const derivedReadOnlyFlagPng = (() => {
    const raw = String(user?.phone || '').trim();
    if (!raw || !raw.startsWith('+') || !countries.length) return '';
    const match = countries
      .filter(c => raw.startsWith(c.dial))
      .sort((a,b) => b.dial.length - a.dial.length)[0];
    return match?.flagPng || '';
  })();

  const selectedCountryObj = countries.find(c => c.name.toLowerCase() === String(user?.country||'').toLowerCase());
  const derivedCountryFlagPng = selectedCountryObj?.flagPng || '';

  return (
    <div className={`${styles.scope} ${styles.page}`}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.bigAvatar}>
            {(avatarPreview || user?.avatarUrl || user?.avatar) ? (
              <img className={styles.bigAvatarImg} src={avatarPreview || user?.avatarUrl || user?.avatar} alt="Avatar" />
            ) : (
              <div className={styles.bigAvatarFallback}>{initials(user?.name)}</div>
            )}
          </div>

          <div className={styles.titleBlock}>
            <h1 className={styles.h1}>{user?.name || 'Unnamed User'}</h1>
            <div className={styles.subRow}>
              {user?.email ? <span className={styles.email}>{user.email}</span> : null}
            </div>
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <SideTab id="profile"  label="My Profile"       active={active} setActive={setActive} />
          <SideTab
            id="edit"
            label="Edit Information"
            active={active}
            setActive={(id) => {
              // persist userId BEFORE entering Edit tab to avoid any guard flicker
              if (userId) localStorage.setItem('userId', String(userId));
              setActive(id);
            }}
          />
          <SideTab id="booking"  label="My Booking"       active={active} setActive={setActive} />
          <button type="button" className={styles.sideTab} onClick={handleLogout}>Logout</button>
        </aside>

        <main className={styles.main}>
          {/* My Profile (read-only) */}
          {active === 'profile' && (
            <div className={styles.form}>
              <AlignedRead label="Name"         value={user?.name} />
              <AlignedRead label="Email"        value={user?.email} />
              <AlignedRead label="Organisation" value={user?.organisation} />

              <AlignedCustom label="Phone">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {derivedReadOnlyFlagPng ? (
                    <img
                      src={derivedReadOnlyFlagPng}
                      alt="Country flag"
                      width={20}
                      height={14}
                      style={{ display: 'block', borderRadius: 2, objectFit: 'cover' }}
                    />
                  ) : null}
                  <span>{derivedPrettyPhone === '—' ? '—' : derivedPrettyPhone}</span>
                </div>
              </AlignedCustom>

              <AlignedRead label="Address" value={user?.address} />

              <div className={styles.row}>
                <AlignedRead label="Country" value={user?.country} />
                <AlignedRead label="State"   value={user?.state} />
              </div>

              <div className={styles.row}>
                <AlignedRead label="City"     value={user?.city} />
                <AlignedRead label="Pincode"  value={user?.pincode} />
              </div>
            </div>
          )}

          {/* Edit */}
          {active === 'edit' && (
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
              <div className={styles.avatarEditor}>
                <div className={styles.bigAvatar}>
                  {(avatarPreview || user?.avatarUrl || user?.avatar) ? (
                    <img className={styles.bigAvatarImg} src={avatarPreview || user?.avatarUrl || user?.avatar} alt="Avatar" />
                  ) : (
                    <div className={styles.bigAvatarFallback}>{initials(user?.name)}</div>
                  )}
                </div>
                <div className={styles.avatarControls}>
                  <label className={styles.fileBtn}>
                    <FaEdit style={{ marginRight: 6 }} />
                    Edit Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickAvatar(e.target.files?.[0])}
                      hidden
                    />
                  </label>

                  {avatarPreview && (
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => setAvatarPreview(null)}
                    >
                      <FaTrash style={{ marginRight: 6 }} />
                      Remove Profile Photo
                    </button>
                  )}
                </div>
              </div>

              <AlignedField id="name"  label="Name"  register={register('name')}  error={errors.name?.message} required />
              <AlignedField id="email" label="Email" type="email" register={register('email')} disabled note="Email can't be changed" />
              <AlignedField id="organisation" label="Organisation" register={register('organisation')} />

              {/* Phone with Country Dial (flag + dial picker) */}
              <AlignedCustom label="Phone">
                <div className={styles.row} style={{ gap: 12, width: '100%' }}>
                  <div
                    className={styles.input}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      paddingRight: 36,
                      overflow: 'hidden',
                      width: '40%',
                      minWidth: 220
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        pointerEvents: 'none'
                      }}
                    >
                      {countries.find(c => c.dial === dialSelected)?.flagPng ? (
                        <img
                          src={countries.find(c => c.dial === dialSelected).flagPng}
                          alt="Country flag"
                          width={20}
                          height={14}
                          style={{ display: 'block', borderRadius: 2, objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ width: 20, height: 14 }} />
                      )}
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {countries.find(c => c.dial === dialSelected)
                          ? `${countries.find(c => c.dial === dialSelected).name} (${dialSelected})`
                          : 'Select country code'}
                      </span>
                    </div>

                    <select
                      aria-label="Country dial code"
                      value={dialSelected}
                      onChange={(e) => setDialSelected(e.target.value)}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select code</option>
                      {countries.map(c => (
                        <option key={`${c.cca2}-${c.dial}`} value={c.dial}>
                          {c.name} ({c.dial})
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    className={styles.input}
                    type="tel"
                    placeholder="Local phone number"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value)}
                    inputMode="numeric"
                    style={{ width: '60%' }}
                  />
                </div>

                <input type="hidden" {...register('phone')} />
                {errors.phone?.message ? <p className={styles.err}>{errors.phone.message}</p> : null}
              </AlignedCustom>

              {/* Country dropdown */}
              <AlignedCustom label="Country">
                <select
                  className={styles.input}
                  value={countryName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCountryName(val);
                    setValue('country', val, { shouldDirty: true });
                    // reset dependent fields
                    setStateName('');
                    setCityName('');
                    setValue('state', '', { shouldDirty: true });
                    setValue('city',  '', { shouldDirty: true });
                  }}
                >
                  <option value="">Select country</option>
                  {countries.map(c => (
                    <option key={c.cca2} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </AlignedCustom>

              {/* State dropdown (depends on selected country) */}
              <AlignedCustom label="State">
                <select
                  className={styles.input}
                  value={stateName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStateName(val);
                    setValue('state', val, { shouldDirty: true });
                    // clear city when state changes
                    setCityName('');
                    setValue('city', '', { shouldDirty: true });
                  }}
                >
                  <option value="">{countryName ? 'Select state' : 'Select country first'}</option>
                  {states.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </AlignedCustom>

              {/* City dropdown (depends on state) */}
              <AlignedCustom label="City">
                <select
                  className={styles.input}
                  value={cityName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCityName(val);
                    setValue('city', val, { shouldDirty: true });
                  }}
                >
                  <option value="">{stateName ? 'Select city' : 'Select state first'}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </AlignedCustom>

              <AlignedField id="address" label="Address" register={register('address')} />
              <AlignedField id="pincode" label="Pincode" register={register('pincode')} />

              <div className={styles.formCta}>
                <button type="button" className={styles.btn} onClick={() => setActive('profile')}>Cancel</button>
                <button type="submit" className={styles.btn} disabled={saving || !userId}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          )}

          {/* Booking */}
          {active === 'booking' && (
            <div className={styles.bookingWrap}>
              <div className={styles.bookingEmpty}>
                <div className={styles.bookingIcon}>🛒</div>
                <h3 className={styles.bookingTitle}>No bookings yet</h3>
                <p className={styles.bookingText}>
                  Go to the shop page and start shopping.
                </p>
                <a href="/shop" className={styles.btn}>Go to Shop</a>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------- aligned building blocks ---------------- */
const LABEL_COL_STYLE = { width: 160, minWidth: 160, flex: '0 0 160px' };
const VALUE_COL_STYLE = { flex: 1, minWidth: 0 };

function AlignedRow({ label, children }) {
  return (
    <div className={styles.field} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className={styles.fieldLabel} style={LABEL_COL_STYLE}>{label}</div>
      <div style={VALUE_COL_STYLE}>{children}</div>
    </div>
  );
}

function AlignedRead({ label, value }) {
  return (
    <AlignedRow label={label}>
      <div className={styles.readInput}>{value || '—'}</div>
    </AlignedRow>
  );
}

function AlignedCustom({ label, children }) {
  return (
    <AlignedRow label={label}>
      <div>{children}</div>
    </AlignedRow>
  );
}

function AlignedField({ id, label, type='text', register, error, disabled, note, required }) {
  return (
    <AlignedRow label={<>{label}{required && <span className={styles.required}>*</span>}</>}>
      <div>
        <input id={id} type={type} className={styles.input} disabled={disabled} {...register} />
        {note && <p className={styles.note}>{note}</p>}
        {error && <p className={styles.err}>{error}</p>}
      </div>
    </AlignedRow>
  );
}

/* ---------------- sidebar tab ---------------- */
function SideTab({ id, label, active, setActive }) {
  const is = active === id;
  return (
    <button
      type="button"
      className={`${styles.sideTab} ${is ? styles.sideTabActive : ''}`}
      onClick={() => setActive(id)}
    >
      {label}
    </button>
  );
}
