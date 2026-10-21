'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GRADES } from '@/lib/i18n';
import { useLanguage, SiteSettingsClient } from '@/context/LanguageContext';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  FileArchive,
  FileCheck2,
  FileUp,
  Lock,
  LogOut,
  Mail,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

interface AdminBranch {
  id: number;
  code: number;
  name_ro: string;
  name_ru: string;
  name_en: string;
  city: string;
  address: string;
  is_active: boolean;
}

interface AdminEmailItem {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

interface AdminStudent {
  id: string;
  student_code: string;
  access_pin?: string;
  first_name: string;
  last_name: string;
  grade: number;
  school: string;
  teacher_name: string;
  exam_language: string;
  branch_code: number;
  branch_name_ro?: string;
  branch_name_ru?: string;
  branch_name_en?: string;
  email: string;
  phone: string;
  email_sent?: boolean;
  has_result_pdf: boolean;
  result_uploaded_at: string | null;
  result_email_sent?: boolean;
  result_email_sent_at?: string | null;
  created_at: string;
}

interface UploadReport {
  matchedCount: number;
  unmatchedCount: number;
  matchedIds: string[];
  unmatchedFiles: string[];
}

interface BulkEmailReport {
  totalTargeted: number;
  sentCount: number;
  failedCount: number;
  sentCodes: string[];
  errors: string[];
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export default function AdminPage() {
  const { locale, t, settings, refreshSettings } = useLanguage();

  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{
    email: string;
    name?: string;
    role?: string;
    picture?: string;
  } | null>(null);
  const [googleClientId, setGoogleClientId] = useState('');

  // Login form state (NO pre-filled password!)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'calendar' | 'branches' | 'admins'
  >('overview');

  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [adminEmails, setAdminEmails] = useState<AdminEmailItem[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, withPdf: 0, withoutPdf: 0 });
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterBranch, setFilterBranch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk PDF / ZIP upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadReport, setUploadReport] = useState<UploadReport | null>(null);

  // Branch form state
  const [bCode, setBCode] = useState(3);
  const [bNameRo, setBNameRo] = useState('');
  const [bNameRu, setBNameRu] = useState('');
  const [bNameEn, setBNameEn] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [savingBranch, setSavingBranch] = useState(false);

  // New Admin Email form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Admin');
  const [savingAdminEmail, setSavingAdminEmail] = useState(false);

  // SMTP / Email Configuration state
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState('azamatjauysh@orizont.md');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('LuminaMath Moldova <azamatjauysh@orizont.md>');
  const [smtpHasPassword, setSmtpHasPassword] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('a.jauysh@gmail.com');
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sending student emails state
  const [sendingStudentEmail, setSendingStudentEmail] = useState<string | null>(null);
  const [sendingBulkEmails, setSendingBulkEmails] = useState(false);
  const [bulkEmailReport, setBulkEmailReport] = useState<BulkEmailReport | null>(null);

  // Calendar & Site Settings form state
  const [calForm, setCalForm] = useState<SiteSettingsClient & { google_client_id?: string }>(
    settings
  );
  const [savingCal, setSavingCal] = useState(false);
  const [calSavedMsg, setCalSavedMsg] = useState(false);

  useEffect(() => {
    setCalForm(settings);
  }, [settings]);

  // Check active HttpOnly cookie session on mount
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((data) => {
        if (data.googleClientId) {
          setGoogleClientId(data.googleClientId);
        }
        if (data.authenticated && data.admin) {
          setAuthenticated(true);
          setCurrentAdmin(data.admin);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  // Initialize official Google Sign-In button if googleClientId is configured
  useEffect(() => {
    if (authenticated || !googleClientId) return;

    const handleGoogleCredential = async (response: { credential: string }) => {
      setSigningIn(true);
      setAuthError(null);
      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || t.admin.invalidPassword);
        } else {
          setAuthenticated(true);
          setCurrentAdmin(data.admin);
        }
      } catch (err) {
        setAuthError((err as Error).message);
      } finally {
        setSigningIn(false);
      }
    };

    const scriptId = 'google-gsi-client-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initGsi = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 340,
          text: 'signin_with',
          shape: 'pill',
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.head.appendChild(script);
    } else {
      initGsi();
    }
  }, [authenticated, googleClientId, t.admin.invalidPassword]);

  const getBranchName = (b: { name_ro?: string; name_ru?: string; name_en?: string }) => {
    if (locale === 'RU') return b.name_ru || b.name_ro;
    if (locale === 'EN') return b.name_en || b.name_ro;
    return b.name_ro;
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBranch) params.set('branchCode', filterBranch);
      if (filterGrade) params.set('grade', filterGrade);
      if (filterLang) params.set('language', filterLang);
      if (searchQuery) params.set('search', searchQuery);

      const [studentsRes, adminsRes, emailCfgRes] = await Promise.all([
        fetch(`/api/admin/students?${params.toString()}`),
        fetch('/api/admin/admins'),
        fetch('/api/admin/email'),
      ]);

      if (studentsRes.status === 401) {
        setAuthenticated(false);
        setCurrentAdmin(null);
        return;
      }

      const data = await studentsRes.json();
      setStudents(data.students || []);
      setBranches(data.branches || []);
      setStats(data.stats || { totalStudents: 0, withPdf: 0, withoutPdf: 0 });

      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        setAdminEmails(adminsData.admins || []);
      }

      if (emailCfgRes.ok) {
        const emailData = await emailCfgRes.json();
        if (emailData.config) {
          setSmtpHost(emailData.config.smtp_host || 'smtp.gmail.com');
          setSmtpPort(Number(emailData.config.smtp_port || 465));
          setSmtpUser(emailData.config.smtp_user || 'azamatjauysh@orizont.md');
          setSmtpFrom(
            emailData.config.smtp_from || 'LuminaMath Moldova <azamatjauysh@orizont.md>'
          );
          setSmtpHasPassword(Boolean(emailData.config.has_password));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, filterBranch, filterGrade, filterLang]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || t.admin.invalidPassword);
      } else {
        setAuthenticated(true);
        setCurrentAdmin(data.admin);
        setLoginPassword('');
      }
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthenticated(false);
    setCurrentAdmin(null);
  };

  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    setSavingAdminEmail(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail,
          name: newAdminName,
          role: newAdminRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.admins) {
        setAdminEmails(data.admins);
        setNewAdminEmail('');
        setNewAdminName('');
      } else {
        alert(data.error || 'Failed to add admin email');
      }
    } finally {
      setSavingAdminEmail(false);
    }
  };

  const handleRemoveAdminEmail = async (email: string) => {
    const res = await fetch(`/api/admin/admins?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (res.ok && data.admins) {
      setAdminEmails(data.admins);
    } else if (data.error) {
      alert(data.error);
    }
  };

  const handleSaveSmtpConfig = async (e: React.FormEvent, sendTest = false) => {
    e.preventDefault();
    setSavingSmtp(true);
    setSmtpFeedback(null);
    try {
      const res = await fetch('/api/admin/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_user: smtpUser,
          smtp_pass: smtpPass,
          smtp_from: smtpFrom,
          sendTestTo: sendTest ? testEmailRecipient : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSmtpFeedback({
          type: 'error',
          text: data.error || 'Eroare la salvarea configurării SMTP',
        });
      } else {
        setSmtpHasPassword(Boolean(data.config?.has_password));
        setSmtpPass('');
        setSmtpFeedback({
          type: 'success',
          text: sendTest
            ? `✅ Configurarea SMTP a fost salvată și email-ul de test a fost trimis către ${testEmailRecipient}!`
            : '✅ Configurarea SMTP a fost salvată cu succes!',
        });
      }
    } catch (err) {
      setSmtpFeedback({ type: 'error', text: (err as Error).message });
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleSendSingleStudentEmail = async (
    studentCode: string,
    action: 'send_registration' | 'send_result'
  ) => {
    setSendingStudentEmail(`${studentCode}:${action}`);
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, studentCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Eroare la trimiterea email-ului');
      } else {
        alert(data.message || 'Email trimis cu succes!');
        fetchAdminData();
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSendingStudentEmail(null);
    }
  };

  const handleSendBulkResultEmails = async (onlyUnsent: boolean) => {
    setSendingBulkEmails(true);
    setBulkEmailReport(null);
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_bulk_results', onlyUnsent }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Eroare la expedierea în masă');
      } else {
        setBulkEmailReport(data);
        fetchAdminData();
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSendingBulkEmails(false);
    }
  };

  const handleUploadPdfs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadReport(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/admin/upload-pdfs', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadReport(data);
        setSelectedFiles([]);
        fetchAdminData();
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDemoGenerateAllPdfs = async () => {
    setUploading(true);
    setUploadReport(null);
    try {
      const res = await fetch('/api/admin/upload-pdfs?demoGenerate=1', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setUploadReport(data);
        fetchAdminData();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bNameRo.trim()) return;
    setSavingBranch(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: bCode,
          name_ro: bNameRo,
          name_ru: bNameRu || bNameRo,
          name_en: bNameEn || bNameRo,
          city: 'Chișinău',
          address: bAddress,
          is_active: true,
        }),
      });
      if (res.ok) {
        setBNameRo('');
        setBNameRu('');
        setBNameEn('');
        setBAddress('');
        setBCode((c) => Math.min(9, c + 1));
        fetchAdminData();
      }
    } finally {
      setSavingBranch(false);
    }
  };

  const handleSaveCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCal(true);
    setCalSavedMsg(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calForm),
      });
      if (res.ok) {
        await refreshSettings();
        if (calForm.google_client_id !== undefined) {
          setGoogleClientId(calForm.google_client_id);
        }
        setCalSavedMsg(true);
        setTimeout(() => setCalSavedMsg(false), 5000);
      }
    } finally {
      setSavingCal(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-slate-500 text-sm">
        {t.admin.checkingSession}
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-center text-slate-900">
            {t.admin.loginTitle}
          </h1>
          <p className="text-xs text-center text-slate-500 mt-1.5 mb-6 leading-relaxed">
            {t.admin.loginAllowedNotice}
          </p>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
              {authError}
            </div>
          )}

          {/* Official Google Sign-In Button (when Google Client ID is configured) */}
          {googleClientId && (
            <div className="mb-6">
              <div ref={googleBtnRef} className="flex justify-center" />
              <div className="relative my-5 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] uppercase font-bold text-slate-400">
                  {t.admin.orDivider}
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                {t.admin.emailLoginLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@orizont.md"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-600 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                {t.admin.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-600 outline-none text-sm font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-lumina-600 hover:from-indigo-700 hover:to-lumina-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md transition-all"
            >
              {signingIn ? '...' : t.admin.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Top Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {currentAdmin?.name} ({currentAdmin?.email})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t.admin.headerTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t.admin.headerSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fetchAdminData()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t.admin.refreshBtn}
          </button>

          <a
            href="/api/admin/students?format=csv"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            {t.admin.exportCsvBtn}
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t.admin.logoutBtn}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-200/70 p-1.5 rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>{t.admin.tabOverview}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTab === 'calendar'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{t.admin.tabCalendar}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branches')}
          className={`flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTab === 'branches'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>{t.admin.tabBranches}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          className={`flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTab === 'admins'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            {t.admin.tabAdmins} ({adminEmails.length})
          </span>
        </button>
      </div>

      {/* TAB 4: AUTHORIZED ADMIN EMAILS (GOOGLE / ORIZONT.MD WHITELIST) */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
                {t.admin.whitelistTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t.admin.whitelistDesc}
              </p>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
              {adminEmails.map((adm) => {
                const isSelf =
                  adm.email.toLowerCase() === currentAdmin?.email?.toLowerCase();
                return (
                  <div
                    key={adm.email}
                    className="p-4 bg-white hover:bg-slate-50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {adm.email}
                        </span>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {adm.role}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {t.admin.youActiveBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{adm.name}</div>
                    </div>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAdminEmail(adm.email)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                        title={t.admin.removeAccessTitle}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add New Admin Email Form */}
            <form
              onSubmit={handleAddAdminEmail}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
            >
              <div className="text-xs font-extrabold uppercase text-indigo-700 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" />
                {t.admin.addAdminTitle}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {t.admin.adminEmailInputLabel}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={t.admin.adminEmailInputPlaceholder}
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {t.admin.adminRoleLabel}
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {t.admin.adminNameLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.admin.adminNamePlaceholder}
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingAdminEmail}
                className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all"
              >
                {savingAdminEmail ? '...' : t.admin.addAdminBtn}
              </button>
            </form>
          </div>

          {/* Right column: Email (SMTP) & Google OAuth Client ID configuration */}
          <div className="lg:col-span-5 space-y-6">
            {/* SMTP / EMAIL SENDER CONFIGURATION CARD */}
            <div className="bg-white rounded-3xl border-2 border-indigo-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  {t.admin.smtpTitle}
                </h3>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                    smtpHasPassword
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {smtpHasPassword ? t.admin.smtpActiveBadge : t.admin.smtpPendingBadge}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {t.admin.smtpDesc}
              </p>

              {smtpFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-bold ${
                    smtpFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {smtpFeedback.text}
                </div>
              )}

              <form
                onSubmit={(e) => handleSaveSmtpConfig(e, false)}
                className="space-y-3"
              >
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {t.admin.smtpServerLabel}
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {t.admin.smtpPortLabel}
                    </label>
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t.admin.smtpSenderLabel}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="azamatjauysh@orizont.md"
                    value={smtpUser}
                    onChange={(e) => {
                      setSmtpUser(e.target.value);
                      setSmtpFrom(`LuminaMath Moldova <${e.target.value}>`);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t.admin.smtpAppPassLabel}
                  </label>
                  <input
                    type="password"
                    placeholder={
                      smtpHasPassword
                        ? t.admin.smtpAppPassSavedPlaceholder
                        : 'xxxx xxxx xxxx xxxx'
                    }
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t.admin.smtpTestRecipientLabel}
                  </label>
                  <input
                    type="email"
                    placeholder="a.jauysh@gmail.com"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingSmtp}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs transition-all"
                  >
                    {savingSmtp ? '...' : t.admin.smtpSaveBtn}
                  </button>

                  <button
                    type="button"
                    disabled={savingSmtp}
                    onClick={(e) => handleSaveSmtpConfig(e, true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t.admin.smtpSaveAndTestBtn}
                  </button>
                </div>
              </form>
            </div>

            {/* GOOGLE OAUTH CLIENT ID CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                {t.admin.googleOauthTitle}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.admin.googleOauthDesc}
              </p>
              <form onSubmit={handleSaveCalendar} className="space-y-3">
                <input
                  type="text"
                  placeholder="xxxx-xxxx.apps.googleusercontent.com"
                  value={calForm.google_client_id || ''}
                  onChange={(e) =>
                    setCalForm({ ...calForm, google_client_id: e.target.value.trim() })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={savingCal}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
                >
                  {t.admin.googleOauthSaveBtn}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALENDAR & DATES EDITOR */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="max-w-4xl">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              {t.admin.calendarEditorTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-1 mb-6 leading-relaxed">
              {t.admin.calendarEditorDesc}
            </p>

            {calSavedMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-extrabold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {t.admin.savedSuccess}
              </div>
            )}

            <form onSubmit={handleSaveCalendar} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-indigo-950 mb-1.5">
                    {t.admin.editionLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={calForm.edition}
                    onChange={(e) => setCalForm({ ...calForm, edition: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase text-indigo-950 mb-1.5">
                    {t.admin.examTimeLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={calForm.exam_time}
                    onChange={(e) => setCalForm({ ...calForm, exam_time: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                  />
                </div>
              </div>

              {/* Stage 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {t.admin.stage1Section}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      🇲🇩 {t.admin.dateRoLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.stage1_date_ro}
                      onChange={(e) => setCalForm({ ...calForm, stage1_date_ro: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      🇷🇺 {t.admin.dateRuLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.stage1_date_ru}
                      onChange={(e) => setCalForm({ ...calForm, stage1_date_ru: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      🇬🇧 {t.admin.dateEnLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.stage1_date_en}
                      onChange={(e) => setCalForm({ ...calForm, stage1_date_en: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {t.admin.stage2Section}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      🇲🇩 {t.admin.dateRoLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.stage2_date_ro}
                      onChange={(e) => setCalForm({ ...calForm, stage2_date_ro: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      🇷🇺 {t.admin.dateRuLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.stage2_date_ru}
                      onChange={(e) => setCalForm({ ...calForm, stage2_date_ru: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      🇬🇧 {t.admin.dateEnLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.stage2_date_en}
                      onChange={(e) => setCalForm({ ...calForm, stage2_date_en: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {t.admin.stage3Section}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      🇲🇩 {t.admin.dateRoLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.stage3_date_ro}
                      onChange={(e) => setCalForm({ ...calForm, stage3_date_ro: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      🇷🇺 {t.admin.dateRuLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.stage3_date_ru}
                      onChange={(e) => setCalForm({ ...calForm, stage3_date_ru: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      🇬🇧 {t.admin.dateEnLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.stage3_date_en}
                      onChange={(e) => setCalForm({ ...calForm, stage3_date_en: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {t.admin.contactSection}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      {t.admin.contactEmailLabel}
                    </label>
                    <input
                      type="email"
                      value={calForm.contact_email}
                      onChange={(e) => setCalForm({ ...calForm, contact_email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      {t.admin.contactPhoneLabel}
                    </label>
                    <input
                      type="text"
                      value={calForm.contact_phone}
                      onChange={(e) => setCalForm({ ...calForm, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingCal}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-lumina-600 hover:from-indigo-700 hover:to-lumina-700 text-white font-extrabold text-sm shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                {savingCal ? t.admin.savingBtn : t.admin.saveCalendarBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: BRANCHES MANAGER */}
      {activeTab === 'branches' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-3xl space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            {t.admin.branchesTitle}
          </h2>

          <div className="space-y-3">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs sm:text-sm"
              >
                <div>
                  <span className="inline-block font-mono font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-700 text-white mr-2">
                    {t.admin.branchCodeBadge} {b.code}
                  </span>
                  <strong className="text-slate-900">{getBranchName(b)}</strong>
                  <div className="text-xs text-slate-500 mt-1">{b.address}</div>
                </div>
                <span className="font-mono text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                  {b.code}XX001
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSaveBranch} className="pt-4 border-t border-slate-200 space-y-4">
            <div className="text-xs font-extrabold uppercase text-indigo-700 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" />
              {t.admin.addBranchTitle}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {t.admin.branchCodeInput}
                </label>
                <input
                  type="number"
                  min={1}
                  max={9}
                  required
                  value={bCode}
                  onChange={(e) => setBCode(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {t.admin.branchNameRoInput}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Chișinău — Filiala Botanica"
                  value={bNameRo}
                  onChange={(e) => setBNameRo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {t.admin.branchNameRuInput}
                </label>
                <input
                  type="text"
                  placeholder="Кишинёв — Филиал Ботаника"
                  value={bNameRu}
                  onChange={(e) => setBNameRu(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {t.admin.branchNameEnInput}
                </label>
                <input
                  type="text"
                  placeholder="Chișinău — Botanica Branch"
                  value={bNameEn}
                  onChange={(e) => setBNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {t.admin.branchAddressInput}
                </label>
                <input
                  type="text"
                  placeholder="mun. Chișinău..."
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingBranch}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all"
            >
              {savingBranch ? t.admin.savingBtn : t.admin.saveBranchBtn}
            </button>
          </form>
        </div>
      )}

      {/* TAB 1: OVERVIEW (STATS + BULK PDF UPLOAD + STUDENTS LIST) */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">
                  {t.admin.statTotalStudents}
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {stats.totalStudents}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">
                  {t.admin.statWithPdf}
                </div>
                <div className="text-3xl font-extrabold text-emerald-700">
                  {stats.withPdf}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileArchive className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">
                  {t.admin.statWithoutPdf}
                </div>
                <div className="text-3xl font-extrabold text-amber-600">
                  {stats.withoutPdf}
                </div>
              </div>
            </div>
          </div>

          {/* BULK PDF / ZIP UPLOAD SECTION (Method 1) */}
          <div className="bg-white rounded-3xl border-2 border-indigo-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-indigo-600" />
                {t.admin.uploadTitle}
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {t.admin.uploadBadge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              {t.admin.uploadDesc}
            </p>

            <form onSubmit={handleUploadPdfs} className="space-y-4">
              <label className="block border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 transition-colors">
                <FileArchive className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <span className="block text-sm font-bold text-slate-800">
                  {t.admin.dropzoneTitle}
                </span>
                <span className="block text-xs text-slate-500 mt-1">
                  {t.admin.dropzoneSub}
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.zip,application/pdf,application/zip"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                />
              </label>

              {selectedFiles.length > 0 && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-medium">
                  {t.admin.selectedFilesLabel} ({selectedFiles.length}):{' '}
                  {selectedFiles.map((f) => f.name).join(', ')}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
                >
                  {uploading ? t.admin.uploadingBtn : t.admin.uploadBtn}
                </button>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleDemoGenerateAllPdfs}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  {t.admin.demoGenerateBtn}
                </button>
              </div>
            </form>

            {uploadReport && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-4 font-bold">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {t.admin.matchedLabel} {uploadReport.matchedCount}
                  </span>
                  {uploadReport.unmatchedCount > 0 && (
                    <span className="text-rose-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {t.admin.unmatchedLabel} {uploadReport.unmatchedCount}
                    </span>
                  )}
                </div>
                {uploadReport.matchedIds.length > 0 && (
                  <div className="text-slate-600">
                    <strong>{t.admin.updatedIdsLabel}</strong>{' '}
                    {uploadReport.matchedIds.join(', ')}
                  </div>
                )}
                {uploadReport.unmatchedFiles.length > 0 && (
                  <div className="text-rose-600">
                    <strong>{t.admin.unmatchedFilesLabel}</strong>{' '}
                    {uploadReport.unmatchedFiles.join('; ')}
                  </div>
                )}
              </div>
            )}

            {/* SEND RESULTS BY EMAIL TO ALL STUDENTS WITH PDF */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    {t.admin.bulkEmailSectionTitle}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t.admin.bulkEmailSectionDesc}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={sendingBulkEmails || stats.withPdf === 0}
                    onClick={() => handleSendBulkResultEmails(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <Send className="w-4 h-4" />
                    {sendingBulkEmails
                      ? t.admin.bulkEmailSendingBtn
                      : t.admin.bulkEmailSendUnsentBtn}
                  </button>

                  <button
                    type="button"
                    disabled={sendingBulkEmails || stats.withPdf === 0}
                    onClick={() => handleSendBulkResultEmails(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold text-xs transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t.admin.bulkEmailResendAllBtn} ({stats.withPdf})
                  </button>
                </div>
              </div>

              {bulkEmailReport && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-extrabold text-emerald-950 flex flex-wrap gap-4">
                    <span>
                      {t.admin.bulkEmailTotalProcessed} {bulkEmailReport.totalTargeted}
                    </span>
                    <span className="text-emerald-700">
                      {t.admin.bulkEmailSentSuccess} {bulkEmailReport.sentCount}
                    </span>
                    {bulkEmailReport.failedCount > 0 && (
                      <span className="text-rose-600">
                        {t.admin.bulkEmailFailed} {bulkEmailReport.failedCount}
                      </span>
                    )}
                  </div>
                  {bulkEmailReport.sentCodes.length > 0 && (
                    <div className="text-slate-700">
                      <strong>{t.admin.bulkEmailSentToLabel}</strong>{' '}
                      {bulkEmailReport.sentCodes.join(', ')}
                    </div>
                  )}
                  {bulkEmailReport.errors.length > 0 && (
                    <div className="text-rose-700 font-semibold">
                      <strong>{t.admin.bulkEmailErrorsLabel}</strong>{' '}
                      {bulkEmailReport.errors.join(' | ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STUDENTS TABLE & FILTERS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                {t.admin.studentsListTitle} ({students.length})
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={t.admin.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchAdminData()}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-indigo-600"
                  />
                </div>

                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="">{t.admin.allBranchesFilter}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.code}>
                      [{b.code}] {getBranchName(b)}
                    </option>
                  ))}
                </select>

                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="">{t.admin.allGradesFilter}</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {t.register.gradeLabel} {g}
                    </option>
                  ))}
                </select>

                <select
                  value={filterLang}
                  onChange={(e) => setFilterLang(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="">{t.admin.allLangsFilter}</option>
                  <option value="RO">RO (Română)</option>
                  <option value="RU">RU (Русский)</option>
                  <option value="EN">EN (English)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                    <th className="py-3.5 px-4">{t.admin.colId}</th>
                    <th className="py-3.5 px-4">{t.admin.colName}</th>
                    <th className="py-3.5 px-4">{t.admin.colGrade}</th>
                    <th className="py-3.5 px-4">{t.admin.colLang}</th>
                    <th className="py-3.5 px-4">{t.admin.colBranch}</th>
                    <th className="py-3.5 px-4">{t.admin.colSchool}</th>
                    <th className="py-3.5 px-4">{t.admin.colContact}</th>
                    <th className="py-3.5 px-4 text-center">{t.admin.colPdf}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <Link
                          href={`/results?id=${s.student_code}&pin=${s.access_pin || ''}`}
                          className="font-black text-base text-indigo-700 hover:underline block"
                        >
                          {s.student_code}
                        </Link>
                        {s.access_pin && (
                          <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            PIN: {s.access_pin}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {s.first_name} {s.last_name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {t.register.gradeLabel} {s.grade}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-800">
                          {s.exam_language}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                        [{s.branch_code}]{' '}
                        {locale === 'RU'
                          ? s.branch_name_ru || s.branch_name_ro
                          : locale === 'EN'
                          ? s.branch_name_en || s.branch_name_ro
                          : s.branch_name_ro}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="font-semibold text-slate-800">{s.school}</div>
                        <div>{s.teacher_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="font-semibold text-slate-800">{s.email}</div>
                        <div>{s.phone}</div>
                        <div className="mt-1">
                          <button
                            type="button"
                            disabled={
                              sendingStudentEmail === `${s.student_code}:send_registration`
                            }
                            onClick={() =>
                              handleSendSingleStudentEmail(s.student_code, 'send_registration')
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                          >
                            <Mail className="w-3 h-3" />
                            {sendingStudentEmail === `${s.student_code}:send_registration`
                              ? t.admin.sendingSingleEmail
                              : s.email_sent
                              ? t.admin.resendIdEmailBtn
                              : t.admin.sendIdEmailBtn}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center space-y-1.5">
                        {s.has_result_pdf ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <a
                              href={`/api/results/${s.student_code}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs hover:bg-emerald-200"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t.admin.pdfActiveBadge}
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>

                            <button
                              type="button"
                              disabled={
                                sendingStudentEmail === `${s.student_code}:send_result`
                              }
                              onClick={() =>
                                handleSendSingleStudentEmail(s.student_code, 'send_result')
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
                                s.result_email_sent
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                              }`}
                            >
                              <Send className="w-3 h-3" />
                              {sendingStudentEmail === `${s.student_code}:send_result`
                                ? '...'
                                : s.result_email_sent
                                ? t.admin.resultEmailSentBadge
                                : t.admin.sendResultEmailBtn}
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-xs">
                            {t.admin.pdfPendingBadge}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        {t.admin.noStudentsFound}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
