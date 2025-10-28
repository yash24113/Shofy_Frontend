'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { FaEdit, FaTrash } from 'react-icons/fa';
import dayjs from 'dayjs';
import {
  pdf as pdfRenderer,
  Document as PDFDocument,
  Page as PDFPage,
  Text as PDFText,
  View as PDFView,
  StyleSheet as PDFStyleSheet,
} from '@react-pdf/renderer';

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
  phone: Yup.string().nullable(),
  address: Yup.string().nullable(),
  city: Yup.string().nullable(),
  state: Yup.string().nullable(),
  country: Yup.string().nullable(),
  pincode: Yup.string().nullable(),
});

/* ---------------- session helpers (client) ---------------- */
const getClientSessionId = () => {
  const fromCookie = Cookies.get('sessionId');
  if (fromCookie) return fromCookie;
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sessionId') || '';
    }
  } catch { /* noop */ }
  return '';
};

const redirectToLogin = () => {
  try {
    const redirect = typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : '/profile';
    window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
  } catch {
    window.location.href = '/login';
  }
};

/* ---------------- PDF styles (react-pdf) ---------------- */
const pdfStyles = PDFStyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 28, paddingHorizontal: 36, fontSize: 10, color: '#1F2A44' },
  tiny: { fontSize: 8, color: '#6B7280' },
  h1: { fontSize: 14, textAlign: 'center', marginBottom: 12, fontWeight: 700 },
  bar: { height: 2, backgroundColor: '#D6A74B', marginVertical: 8 },
  sectionCard: { border: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  label: { fontSize: 8, color: '#6B7280', marginBottom: 2 },
  value: { fontSize: 10, color: '#111827' },
  badgeTitle: { textAlign: 'center', fontSize: 12, fontWeight: 700, marginVertical: 8 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  metaItem: { flex: 1, border: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 8 },
  table: { marginTop: 12, borderRadius: 6, border: 1, borderColor: '#E5E7EB' },
  thead: { backgroundColor: '#F3F4F6', flexDirection: 'row' },
  th: { flex: 1, padding: 8, fontWeight: 700, fontSize: 9 },
  tdRow: { flexDirection: 'row', borderTop: 1, borderColor: '#E5E7EB' },
  td: { flex: 1, padding: 8, fontSize: 9 },
  totalsBox: { marginTop: 12, width: 240, alignSelf: 'flex-end', border: 1, borderColor: '#E5E7EB', borderRadius: 6 },
  totalsRow: { flexDirection: 'row', borderTop: 1, borderColor: '#E5E7EB' },
  totalsCellL: { flex: 1, padding: 6, fontSize: 9 },
  totalsCellR: { width: 80, padding: 6, fontSize: 9, textAlign: 'right' },
  totalsHead: { backgroundColor: '#EEF2FF', fontWeight: 700 },
  footer: { marginTop: 22, textAlign: 'center', fontSize: 8, color: '#6B7280' },
});

/* =============================== Component =============================== */
export default function UserProfile() {
  /* Guard: if no session, redirect */
  useEffect(() => {
    const sid = getClientSessionId();
    if (!sid) redirectToLogin();
  }, []);

  const authUser = useSelector((s) => s?.auth?.user);
  const cookieUser = useMemo(() => pickInitialUser(authUser), [authUser]);
  const derivedUserId = (authUser?._id || cookieUser?._id);

  useEffect(() => {
    if (derivedUserId) localStorage.setItem('userId', String(derivedUserId));
  }, [derivedUserId]);

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
  const user = {
    ...(localUser || authUser || sessionData?.session?.user || cookieUser || {}),
    avatar: (localUser?.userImage || authUser?.userImage || sessionData?.session?.user?.userImage || cookieUser?.userImage)
      ? (localUser?.userImage || authUser?.userImage || sessionData?.session?.user?.userImage || cookieUser?.userImage)
      : (localUser?.avatar || authUser?.avatar || sessionData?.session?.user?.avatar || cookieUser?.avatar)
  };

  const [logoutUser] = useLogoutUserMutation();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();

  const [active, setActive] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState(null);

  /* Countries + dial codes */
  const [countries, setCountries] = useState([]);
  const [dialSelected, setDialSelected] = useState(''); // +91
  const [phoneLocal, setPhoneLocal] = useState('');     // digits only

  /* Dependent state/city */
  const [countryName, setCountryName] = useState(user?.country || '');
  const [states, setStates] = useState([]);
  const [stateName, setStateName] = useState(user?.state || '');
  const [cities, setCities] = useState([]);
  const [cityName, setCityName] = useState(user?.city || '');

  /* -------------------- Orders (My Orders tab) -------------------- */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersErr, setOrdersErr] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) return;
      setOrdersLoading(true);
      setOrdersErr(null);
      try {
        const res = await fetch(`https://test.amrita-fashions.com/shopy/orders/user/${userId}`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const json = await res.json();
        const list = json?.data?.orders || [];
        setOrders(Array.isArray(list) ? list : []);
      } catch (e) {
        setOrdersErr('Failed to load orders');
      } finally {
        setOrdersLoading(false);
      }
    };
    if (active === 'booking') fetchOrders();
  }, [active, userId]);

  /* -------------------- react-hook-form -------------------- */
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

  useEffect(() => {
    if (!avatarPreview || (typeof avatarPreview === 'string' && avatarPreview.startsWith('data:image'))) {
      setAvatarPreview(user?.userImage || user?.avatarUrl || user?.avatar || null);
    }
    setCountryName(user?.country || '');
    setStateName(user?.state || '');
    setCityName(user?.city || '');
  }, [user, reset, avatarPreview]);

  useEffect(() => {
    const composed = (dialSelected && phoneLocal)
      ? `${normalizeDial(dialSelected)}${onlyDigits(phoneLocal)}`
      : (user?.phone || '');
    setValue('phone', composed, { shouldValidate: false, shouldDirty: true });
  }, [dialSelected, phoneLocal, setValue, user?.phone]);

  /* ---------------- country/state/city sources ---------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,cca2,flags');
        const raw = await res.json();
        const list = (raw || [])
          .map((r) => {
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
          .filter((x) => x.cca2 && x.name && x.dial && x.flagPng)
          .sort((a,b) => a.name.localeCompare(b.name));
        if (mounted) setCountries(list);
      } catch {
        setCountries([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
          if (!list.find((s) => s.name === stateName)) {
            setStateName(''); setCities([]); setCityName('');
          }
        }
      } catch {
        if (!abort) { setStates([]); setStateName(''); setCities([]); setCityName(''); }
      }
    })();
    return () => { abort = true; };
  }, [countryName]);

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

  /* ---------------- Avatar pick ---------------- */
  const onPickAvatar = (file) => {
    if (!file) return;
    if (!file.type.match('image.*')) { notifyError('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { notifyError('Image size should be less than 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result || null;
      setAvatarPreview(result);
      setLocalUser((prev) => ({ ...(prev || {}), userImage: result, avatar: result }));
    };
    reader.onerror = () => notifyError('Failed to read the image file');
    reader.readAsDataURL(file);
  };

  /* ---------------- Save profile ---------------- */
  const onSubmit = async (data) => {
    if (!userId) { notifyError('Cannot update profile: user not identified.'); return; }

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

    if (avatarPreview) {
      const currentImage = user?.userImage || user?.avatarUrl || user?.avatar;
      if (avatarPreview !== currentImage) {
        candidate.avatar = avatarPreview;
        candidate.userImage = avatarPreview;
      }
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
        const msg =
          e2?.data?.message || e1?.data?.message || e2?.error || e1?.error || 'Update failed';
        notifyError(msg);
        return;
      }
    }

    const updatedUser = {
      ...(updatedResp?.user || updatedResp || { ...user, ...changed }),
      userImage: (updatedResp?.user?.userImage || updatedResp?.userImage || user.userImage || user.avatar),
      avatar: (updatedResp?.user?.userImage || updatedResp?.userImage || user.userImage || user.avatar)
    };

    if (updatedUser.userImage && updatedUser.userImage !== avatarPreview) {
      setAvatarPreview(updatedUser.userImage);
    }

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

    try { writeUserInfoCookiePreserving(updatedUser); } catch(err){console.log("Error refetching session:", err);} 

    try {
      const p = refetchSession?.();
      if (p && typeof p.then === 'function') await p;
    } catch(err){console.log("Error refetching session:", err);} 

    notifySuccess('Profile updated');
    setActive('profile');
  };

  const handleLogout = async () => {
    try {
      await logoutUser({ userId }).unwrap();
      Cookies.remove('userInfo');
      try { localStorage.removeItem('sessionId'); } catch(err){console.log("Error refetching session:", err);}
      window.location.href = '/login';
    } catch (err) {
      notifyError(err?.data?.message || 'Logout failed');
    }
  };

  /* ---- Derived values for read-only display ---- */
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

  /* ---------------- PDF generator ---------------- */
  const generateInvoicePdf = async (order) => {
    const company = {
      name: 'AMRITA GLOBAL ENTERPRISES',
      tagline: 'Textiles & Fabrics • B2B',
      addr1: '4th Floor, Safal Prelude, 404 Corporate Road, Near YMCA Club,',
      addr2: 'Prahlad Nagar, Ahmedabad, Gujarat, India - 380015',
      email: 'info@amritafashions.com',
      phone: '+91 98240 03484'
    };

    const billTo = {
      name: `${order.firstName || ''} ${order.lastName || ''}`.trim() || order?.userId?.name || '',
      phone: order.phone || order?.userId?.phone || '',
      email: order.email || order?.userId?.email || '',
      address: order.streetAddress || order?.userId?.address || '',
      city: order.city || order?.userId?.city || '',
      postcode: order.postcode || order?.userId?.pincode || '',
      country: order.country || order?.userId?.country || ''
    };

    const created = dayjs(order.createdAt).format('MMMM DD, YYYY');
    const orderNo = String(order._id);

    const doc = (
      <PDFDocument>
        <PDFPage size="A4" style={pdfStyles.page}>
          <PDFText style={pdfStyles.h1}>{company.name}</PDFText>
          <PDFText style={{ textAlign: 'center', fontSize: 8, color: '#6B7280' }}>{company.tagline}</PDFText>
          <PDFView style={pdfStyles.bar} />

          <PDFText style={pdfStyles.badgeTitle}>INVOICE</PDFText>

          <PDFView style={[pdfStyles.row, { marginTop: 6 }]}>
            {/* Bill To */}
            <PDFView style={[pdfStyles.col, pdfStyles.sectionCard]}>
              <PDFText style={pdfStyles.label}>BILL TO</PDFText>
              <PDFText style={pdfStyles.value}>{billTo.name}</PDFText>
              {billTo.phone ? <PDFText style={pdfStyles.tiny}>{billTo.phone}</PDFText> : null}
              {billTo.email ? <PDFText style={pdfStyles.tiny}>{billTo.email}</PDFText> : null}
              {billTo.address ? <PDFText style={pdfStyles.tiny}>{billTo.address}</PDFText> : null}
              <PDFText style={pdfStyles.tiny}>
                {[billTo.city, billTo.country, billTo.postcode].filter(Boolean).join(', ')}
              </PDFText>
            </PDFView>

            {/* From */}
            <PDFView style={[pdfStyles.col, pdfStyles.sectionCard]}>
              <PDFText style={pdfStyles.label}>FROM</PDFText>
              <PDFText style={pdfStyles.value}>Amrita Global Enterprises</PDFText>
              <PDFText style={pdfStyles.tiny}>{company.addr1}</PDFText>
              <PDFText style={pdfStyles.tiny}>{company.addr2}</PDFText>
              <PDFText style={pdfStyles.tiny}>{company.email}   •   {company.phone}</PDFText>
            </PDFView>
          </PDFView>

          {/* Meta */}
          <PDFView style={pdfStyles.metaRow}>
            <PDFView style={pdfStyles.metaItem}>
              <PDFText style={pdfStyles.label}>INVOICE NUMBER</PDFText>
              <PDFText style={pdfStyles.value}>{orderNo}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.metaItem}>
              <PDFText style={pdfStyles.label}>INVOICE DATE</PDFText>
              <PDFText style={pdfStyles.value}>{created}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.metaItem}>
              <PDFText style={pdfStyles.label}>PAYMENT</PDFText>
              <PDFText style={pdfStyles.value}>{String(order.payment || 'ONLINE').toUpperCase()}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.metaItem}>
              <PDFText style={pdfStyles.label}>SHIPPING</PDFText>
              <PDFText style={pdfStyles.value}>{String(order.shipping || 'STANDARD').toUpperCase()}</PDFText>
            </PDFView>
          </PDFView>

          {/* Items */}
          <PDFView style={pdfStyles.table}>
            <PDFView style={pdfStyles.thead}>
              <PDFText style={[pdfStyles.th, { flex: 0.2 }]}>#</PDFText>
              <PDFText style={[pdfStyles.th, { flex: 2.3 }]}>Product</PDFText>
              <PDFText style={[pdfStyles.th, { flex: 0.5, textAlign: 'right' }]}>Qty</PDFText>
              <PDFText style={[pdfStyles.th, { flex: 0.7, textAlign: 'right' }]}>Price</PDFText>
              <PDFText style={[pdfStyles.th, { flex: 0.8, textAlign: 'right' }]}>Amount</PDFText>
            </PDFView>

            {(order.productId || []).map((p, idx) => {
              const qty = Array.isArray(order.quantity) ? (order.quantity[idx] || 0) : 0;
              const price = Array.isArray(order.price) ? (order.price[idx] || 0) : 0;
              const amount = (Number(qty) || 0) * (Number(price) || 0);
              return (
                <PDFView key={p?._id || idx} style={pdfStyles.tdRow}>
                  <PDFText style={[pdfStyles.td, { flex: 0.2 }]}>{idx + 1}</PDFText>
                  <PDFText style={[pdfStyles.td, { flex: 2.3 }]}>{p?.name || '—'}</PDFText>
                  <PDFText style={[pdfStyles.td, { flex: 0.5, textAlign: 'right' }]}>{qty}</PDFText>
                  <PDFText style={[pdfStyles.td, { flex: 0.7, textAlign: 'right' }]}>₹{Number(price).toFixed(2)}</PDFText>
                  <PDFText style={[pdfStyles.td, { flex: 0.8, textAlign: 'right' }]}>₹{Number(amount).toFixed(2)}</PDFText>
                </PDFView>
              );
            })}
          </PDFView>

          {/* Totals */}
          <PDFView style={pdfStyles.totalsBox}>
            <PDFView style={pdfStyles.totalsRow}>
              <PDFText style={pdfStyles.totalsCellL}>Subtotal</PDFText>
              <PDFText style={pdfStyles.totalsCellR}>₹{Number(order.total || 0).toFixed(2)}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.totalsRow}>
              <PDFText style={pdfStyles.totalsCellL}>Shipping</PDFText>
              <PDFText style={pdfStyles.totalsCellR}>₹{Number(order.shippingCost || 0).toFixed(2)}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.totalsRow}>
              <PDFText style={pdfStyles.totalsCellL}>Discount</PDFText>
              <PDFText style={pdfStyles.totalsCellR}>₹{Number(order.discount || 0).toFixed(2)}</PDFText>
            </PDFView>
            <PDFView style={[pdfStyles.totalsRow, pdfStyles.totalsHead]}>
              <PDFText style={pdfStyles.totalsCellL}>Total</PDFText>
              <PDFText style={pdfStyles.totalsCellR}>
                ₹{(Number(order.total || 0) + Number(order.shippingCost || 0) - Number(order.discount || 0)).toFixed(2)}
              </PDFText>
            </PDFView>
          </PDFView>

          <PDFView style={pdfStyles.footer}>
            <PDFText>
              404, Safal Prelude, Corporate Rd, Prahlad Nagar, Ahmedabad, Gujarat 380015 • info@amritafashions.com • amrita-fashions.com • +91 98240 03484
            </PDFText>
          </PDFView>
        </PDFPage>
      </PDFDocument>
    );

    const blob = await pdfRenderer(doc).toBlob();
    const fname = `AGE-Invoice-${orderNo}.pdf`;
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className={`${styles.scope} ${styles.page}`}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.bigAvatar}>
            {(avatarPreview || user?.userImage || user?.avatarUrl || user?.avatar) ? (
              <img className={styles.bigAvatarImg} src={avatarPreview || user?.userImage || user?.avatarUrl || user?.avatar} alt="Avatar" />
            ) : (
              <div className={styles.bigAvatarFallback}>{initials(user?.name)}</div>
            )}
          </div>

          <div className={styles.titleBlock}>
            <h1 className={styles.h1}>{user?.name || 'Guest User'}</h1>
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
            label="Edit Profile"
            active={active}
            setActive={(id) => {
              if (userId) localStorage.setItem('userId', String(userId));
              setActive(id);
            }}
          />
          <SideTab id="booking"  label="My Orders"       active={active} setActive={setActive} />
          <button type="button" className={styles.sideTab} onClick={handleLogout}>Logout</button>
        </aside>

        <main className={styles.main}>
          {/* My Profile */}
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
                  {(avatarPreview || user?.userImage || user?.avatarUrl || user?.avatar) ? (
                    <img className={styles.bigAvatarImg} src={avatarPreview || user?.userImage || user?.avatarUrl || user?.avatar} alt="Avatar" />
                  ) : (
                    <div className={styles.bigAvatarFallback}>{initials(user?.name)}</div>
                  )}
                </div>
                <div className={styles.avatarControls}>
                  <label className={styles.fileBtn}>
                    <FaEdit style={{ marginRight: 6 }} />
                    Edit Photo
                    <input type="file" accept="image/*" onChange={(e) => onPickAvatar(e.target.files?.[0])} hidden />
                  </label>

                  {avatarPreview && (
                    <button type="button" className={styles.linkBtn} onClick={() => setAvatarPreview(null)}>
                      <FaTrash style={{ marginRight: 6 }} />
                      Remove Profile Photo
                    </button>
                  )}
                </div>
              </div>

              <AlignedField id="name"  label="Name"  register={register('name')}  error={errors?.name?.message} required />
              <AlignedField id="email" label="Email" type="email" register={register('email')} disabled note="Email can't be changed" />
              <AlignedField id="organisation" label="Organisation" register={register('organisation')} />

              {/* Phone with Country Dial */}
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
                          src={countries.find(c => c.dial === dialSelected)?.flagPng}
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
                          ? `${countries.find(c => c.dial === dialSelected)?.name} (${dialSelected})`
                          : 'Select country code'}
                      </span>
                    </div>

                    <select
                      aria-label="Country dial code"
                      value={dialSelected}
                      onChange={(e) => setDialSelected(e.target.value)}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
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
                {errors?.phone?.message ? <p className={styles.err}>{errors.phone.message}</p> : null}
              </AlignedCustom>

              {/* Country/State/City */}
              <AlignedCustom label="Country">
                <select
                  className={styles.input}
                  value={countryName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCountryName(val);
                    setValue('country', val, { shouldDirty: true });
                    setStateName(''); setCityName('');
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

              <AlignedCustom label="State">
                <select
                  className={styles.input}
                  value={stateName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStateName(val);
                    setValue('state', val, { shouldDirty: true });
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

          {/* My Orders */}
          {active === 'booking' && (
            <div className={styles.bookingWrap}>
              {ordersLoading && (<div className={styles.bookingEmpty}><p>Loading orders…</p></div>)}

              {ordersErr && (<div className={styles.bookingEmpty}><p style={{ color: 'red' }}>{ordersErr}</p></div>)}

              {!ordersLoading && !ordersErr && (!orders || orders.length === 0) && (
                <div className={styles.bookingEmpty}>
                  <div className={styles.bookingIcon}>🧾</div>
                  <h3 className={styles.bookingTitle}>No orders yet</h3>
                  <p className={styles.bookingText}>Go to the shop page and start shopping.</p>
                  <a href="/shop" className={styles.btn}>Go to Shop</a>
                </div>
              )}

              {!ordersLoading && !ordersErr && orders && orders.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      borderSpacing: 0,
                      background: 'white',
                      borderRadius: 8,
                      overflow: 'hidden'
                    }}
                  >
                    <thead style={{ background: '#F3F4F6' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600 }}>Invoice Number</th>
                        <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600 }}>Invoice Date</th>
                        <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id} style={{ borderTop: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <a
                              href="#"
                              onClick={(e) => { e.preventDefault(); generateInvoicePdf(o); }}
                              style={{ color: '#2C4C97', textDecoration: 'underline' }}
                              title="Open & download PDF"
                            >
                              {o._id}
                            </a>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {dayjs(o.createdAt).format('MMMM DD, YYYY')}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <button
                              type="button"
                              onClick={() => generateInvoicePdf(o)}
                              title="Download PDF"
                              className={styles.btn}
                              style={{ padding: '6px 12px' }}
                            >
                              📄 PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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