"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, 
  Upload, 
  Users, 
  TrendingUp, 
  Database, 
  Search, 
  Trash2, 
  Shield, 
  FileSpreadsheet, 
  Loader2, 
  Sparkles, 
  LogOut, 
  School, 
  Sun, 
  Moon, 
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Settings,
  Key,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// SVG Logo matching original NutriAlerta
function NutriAlertaLogo({ className = "w-6 h-6 text-white" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path 
        d="M7 17.5V6.5l10 11V6.5" 
        stroke="currentColor" 
        strokeWidth="3.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function UnifiedSchoolPortal() {
  const router = useRouter();
  const nutrialertaUrl = process.env.NEXT_PUBLIC_NUTRIALERTA_URL || "http://localhost:3000";
  
  // Theme & Session states
  const [darkMode, setDarkMode] = useState(false);
  const [schoolName, setSchoolName] = useState('Escola Municipal');
  const [escolaId, setEscolaId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // User Role State
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'schools' | 'accounts'>('schools');

  // Superadmin States
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolBairro, setNewSchoolBairro] = useState('');
  const [creatingSchool, setCreatingSchool] = useState(false);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<any[]>([]);

  // Form State (Regular School User)
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('M');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [imc, setImc] = useState<number | null>(null);
  const [imcClassification, setImcClassification] = useState('');
  const [imcColor, setImcColor] = useState('');

  // Refs for Autofocus & Quick keyboard navigation
  const ageInputRef = useRef<HTMLInputElement>(null);

  // CSV State (Regular School User)
  const [showCsv, setShowCsv] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List & Status states (Regular School User)
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-dismiss timers for notifications (non-blocking toasts)
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Theme Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nextDark ? 'dark' : 'light');
      if (nextDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Auth & Session Check
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Redirect if no session is present
      if (!session) {
        const getProjectRef = () => {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
          const match = url.match(/https:\/\/([^.]+)\.supabase\.(co|net)/);
          return match ? match[1] : "peqvaslchaxrewhtxltc";
        };
        const projectRef = getProjectRef();
        document.cookie = `sb-${projectRef}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        window.location.href = `${nutrialertaUrl}?logout=true`;
        return;
      }

      try {
        const { data, error } = await supabase.from('escolas').select('id').limit(1);
        if (error) throw error;
        setDbStatus('connected');
      } catch (err) {
        console.warn("Real database check failed:", err);
        setDbStatus('error');
      }

      let currentEscolaId = 1;

      // Determine active role based on e-mail
      const userEmail = session.user.email || '';

      // Bloqueio de Segurança para o usuário de teste de apresentação no portal escolar
      if (userEmail.toLowerCase() === 'teste@nutrialerta.com') {
        await supabase.auth.signOut();
        const getProjectRef = () => {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
          const match = url.match(/https:\/\/([^.]+)\.supabase\.(co|net)/);
          return match ? match[1] : "peqvaslchaxrewhtxltc";
        };
        const projectRef = getProjectRef();
        document.cookie = `sb-${projectRef}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        window.location.href = `${nutrialertaUrl}?logout=true&restricted=true`;
        return;
      }

      const superAdminCheck = userEmail === 'nutrialerta@gmail.com';
      setIsSuperAdmin(superAdminCheck);

      if (superAdminCheck) {
        // Fetch schools list for dropdown and management
        await fetchSchools();
        await fetchCreatedAccounts();
        setLoading(false);
      } else {
        // Regular School Portal Check
        const metadataId = session.user.user_metadata?.escola_id;
        currentEscolaId = metadataId ? Number(metadataId) : 1;
        setEscolaId(currentEscolaId);

        // Fetch school name from 'escolas' table
        const fallbackName = session.user.user_metadata?.school_name || session.user.user_metadata?.name || session.user.email?.split('@')[0].toUpperCase() || 'Escola';
        setSchoolName(fallbackName);

        try {
          const { data, error } = await supabase
            .from('escolas')
            .select('nome')
            .eq('id', currentEscolaId)
            .single();
          if (!error && data?.nome) {
            setSchoolName(data.nome);
          }
        } catch (err) {
          console.warn("Could not query Escola Name from table, using metadata fallback:", err);
        }

        await fetchRecords(currentEscolaId);
        setLoading(false);
      }
      
      // Auto focus the age input on initial load (if school user)
      if (!superAdminCheck) {
        setTimeout(() => {
          ageInputRef.current?.focus();
        }, 300);
      }
    };

    checkSession();
  }, [router]);

  // Fetch Schools (Superadmin)
  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const { data, error } = await supabase
        .from('escolas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setSchools(data || []);
    } catch (err: any) {
      console.error("Failed fetching schools from Supabase:", err.message);
      setErrorMsg("Erro ao carregar escolas.");
    } finally {
      setLoadingSchools(false);
    }
  };

  // Fetch Created Accounts (Superadmin)
  const fetchCreatedAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, escolas(nome)')
        .order('email', { ascending: true });

      if (error) {
        // Fallback to simple select if join fails
        const { data: simpleData, error: simpleError } = await supabase
          .from('usuarios')
          .select('*')
          .order('email', { ascending: true });
        if (simpleError) throw simpleError;
        setCreatedAccounts(simpleData || []);
      } else {
        // Map data to match the expected createdAccounts structure
        const mapped = (data || []).map((acc: any) => ({
          ...acc,
          school_name: acc.escolas?.nome || acc.school_name || 'Escola'
        }));
        setCreatedAccounts(mapped);
      }
    } catch (err: any) {
      console.error("Failed fetching created accounts:", err.message);
    }
  };

  // Create School and Acess Login (Superadmin)
  const handleCreateSchoolAndAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim() || !newSchoolBairro.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setErrorMsg("Todos os campos são obrigatórios!");
      return;
    }

    setCreatingSchool(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const schoolNameVal = newSchoolName.trim();
    const neighborhood = newSchoolBairro.trim();
    const emailVal = newUserEmail.trim();
    const passVal = newUserPassword.trim();

    // Banco de dados real (Supabase)
    try {
      // Passo A: Inserir escola
      const { data: schoolData, error: schoolError } = await supabase
        .from('escolas')
        .insert([
          {
            nome: schoolNameVal,
            bairro: neighborhood
          }
        ])
        .select();

      if (schoolError) {
        throw new Error(`Erro ao cadastrar a escola no banco: ${schoolError.message}`);
      }

      if (!schoolData || schoolData.length === 0) {
        throw new Error('Falha ao obter dados da escola cadastrada.');
      }

      const generatedSchoolId = schoolData[0].id;
      const generatedSchoolName = schoolData[0].nome;

      // Passo B: Criar login no Auth
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });

      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: emailVal,
        password: passVal,
        options: {
          data: {
            escola_id: generatedSchoolId,
            school_name: generatedSchoolName,
            role: 'school'
          }
        }
      });

      if (authError) {
        throw new Error(`Escola cadastrada (ID #${generatedSchoolId}), mas erro ao criar conta de acesso: ${authError.message}`);
      }

      setSuccessMsg(`Escola "${generatedSchoolName}" e login associado criados com sucesso! Se a confirmação de e-mail estiver ativa, verifique a caixa de entrada.`);
      
      setNewSchoolName('');
      setNewSchoolBairro('');
      setNewUserEmail('');
      setNewUserPassword('');

      await fetchSchools();
      await fetchCreatedAccounts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar cadastro de escola e acesso.');
    } finally {
      setCreatingSchool(false);
    }
  };

  // Fetch School Records (Regular User)
  const fetchRecords = async (currentEscolaId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registros_saude')
        .select('*')
        .eq('escola_id', currentEscolaId)
        .order('data_coleta', { ascending: false });

      if (error) throw error;

      const processed = (data || []).map(r => ({
        ...r,
        imc: Number((r.peso / (r.altura * r.altura)).toFixed(1))
      }));
      setRecords(processed);
    } catch (err: any) {
      console.error("Failed fetching from Supabase:", err.message);
      setErrorMsg("Erro ao carregar registros de saúde.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time BMI calculator
  const getImcStatus = (imcValue: number) => {
    if (imcValue < 16) return { label: 'Desnutrição Grave', color: 'text-red-500 bg-red-500/10 border-red-500/20', category: 'ALERT' };
    if (imcValue < 18.5) return { label: 'Abaixo do Peso', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', category: 'ALERT' };
    if (imcValue < 25) return { label: 'Peso Ideal', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', category: 'NORMAL' };
    if (imcValue < 30) return { label: 'Sobrepeso', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', category: 'ALERT' };
    return { label: 'Obesidade', color: 'text-red-500 bg-red-500/10 border-red-500/20', category: 'ALERT' };
  };

  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (w > 0 && h > 0) {
      const hInMeters = h > 3 ? h / 100 : h;
      const calculatedImc = Number((w / (hInMeters * hInMeters)).toFixed(1));
      setImc(calculatedImc);

      const status = getImcStatus(calculatedImc);
      setImcClassification(status.label);
      setImcColor(status.color);
    } else {
      setImc(null);
      setImcClassification('');
      setImcColor('');
    }
  }, [weight, height]);

  // Form Submit (Regular User)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age || !weight || !height) return;

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const ageVal = parseInt(age);
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const heightInMeters = h > 3 ? h / 100 : h;

    try {
      const { data, error } = await supabase
        .from('registros_saude')
        .insert([
          {
            escola_id: escolaId,
            genero: gender,
            idade: ageVal,
            peso: w,
            altura: heightInMeters,
            data_coleta: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      const newId = data && data[0] ? data[0].id : Math.floor(Math.random() * 10000);
      setSuccessMsg(`Registro adicionado com sucesso! Cód: #${newId}`);
      setAge('');
      setWeight('');
      setHeight('');
      await fetchRecords(escolaId);

      // Autofocus back to age for fast keyboard input
      setTimeout(() => {
        ageInputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar registro de saúde.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Record (Regular User)
  const handleDelete = async (id: number) => {
    if (!confirm(`Excluir permanentemente o registro #${id}?`)) return;

    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('registros_saude')
        .delete()
        .eq('id', id)
        .eq('escola_id', escolaId);

      if (error) throw error;
      setSuccessMsg(`Registro #${id} excluído.`);
      await fetchRecords(escolaId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao deletar registro.');
    }
  };

  // CSV Import Logic (Regular User)
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        
        if (lines.length <= 1) {
          throw new Error('O arquivo CSV está vazio.');
        }

        // Detect delimiter based on first line
        const header = lines[0].trim();
        let delimiter = ',';
        if (header.includes(';')) {
          delimiter = ';';
        }

        const parsedRows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length < 4) continue;

          const gen = cols[0].toUpperCase();
          const ageVal = parseInt(cols[1]);
          
          // Replace comma with dot for decimals (e.g. 28,5 -> 28.5)
          const rawWeight = cols[2].replace(',', '.');
          const rawHeight = cols[3].replace(',', '.');
          
          const w = parseFloat(rawWeight);
          const h = parseFloat(rawHeight);

          if (isNaN(ageVal) || isNaN(w) || isNaN(h)) continue;

          const hInMeters = h > 3 ? h / 100 : h;
          const calculatedImc = Number((w / (hInMeters * hInMeters)).toFixed(1));

          parsedRows.push({
            genero: gen === 'M' || gen === 'F' ? gen : 'M',
            idade: ageVal,
            peso: w,
            altura: hInMeters,
            imc: calculatedImc
          });
        }

        if (parsedRows.length === 0) {
          throw new Error('Nenhum registro válido encontrado. Certifique-se de preencher: genero,idade,peso,altura');
        }

        setCsvData(parsedRows);
      } catch (err: any) {
        setCsvError(err.message || 'Erro no processamento do CSV.');
        setCsvFile(null);
        setCsvData([]);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (csvData.length === 0) return;
    setSubmitting(true);
    setSuccessMsg(null);
    setCsvError(null);

    const dbPayload = csvData.map(r => ({
      escola_id: escolaId,
      genero: r.genero,
      idade: r.idade,
      peso: r.peso,
      altura: r.altura,
      data_coleta: new Date().toISOString()
    }));

    try {
      const { error } = await supabase
        .from('registros_saude')
        .insert(dbPayload);

      if (error) throw error;

      setSuccessMsg(`${csvData.length} registros cadastrados com sucesso!`);
      setCsvFile(null);
      setCsvData([]);
      setShowCsv(false);
      await fetchRecords(escolaId);
    } catch (err: any) {
      setCsvError(err.message || 'Erro ao salvar importação.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "genero,idade,peso,altura\n"
      + "M,8,28.5,1.26\n"
      + "F,9,34.2,1.35\n"
      + "M,10,40.1,1.38";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "exemplo_nutri_schools.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Logout Handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    
    // Clear session cookie
    const getProjectRef = () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const match = url.match(/https:\/\/([^.]+)\.supabase\.(co|net)/);
      return match ? match[1] : "peqvaslchaxrewhtxltc";
    };
    const projectRef = getProjectRef();
    document.cookie = `sb-${projectRef}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    
    window.location.href = `${nutrialertaUrl}?logout=true`;
  };

  // Live filter computation (Regular User)
  useEffect(() => {
    let result = records;

    if (searchTerm.trim()) {
      result = result.filter(r => String(r.id).includes(searchTerm.trim()));
    }

    if (genderFilter !== 'ALL') {
      result = result.filter(r => r.genero === genderFilter);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(r => {
        const status = getImcStatus(r.imc);
        if (statusFilter === 'NORMAL') return status.category === 'NORMAL';
        if (statusFilter === 'ALERT') return status.category === 'ALERT';
        return true;
      });
    }

    setFilteredRecords(result);
  }, [searchTerm, genderFilter, statusFilter, records]);

  // Aggregated analytics variables
  const totalCount = records.length;
  const avgImc = totalCount > 0 
    ? Number((records.reduce((acc, curr) => acc + curr.imc, 0) / totalCount).toFixed(1))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black text-slate-800 dark:text-[#f5f5f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Carregando portal escolar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-850 dark:text-[#f5f5f7] flex flex-col font-sans transition-colors duration-300">
      
      {/* Toast notifications container in the bottom right corner */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="pointer-events-auto p-4 bg-emerald-550 dark:bg-emerald-950/95 backdrop-blur-md border border-emerald-500/20 text-white rounded-2xl flex items-center gap-3 shadow-xl font-bold text-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 animate-bounce" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
              <button 
                onClick={() => setSuccessMsg(null)} 
                className="text-white hover:opacity-80 transition-opacity font-black text-base cursor-pointer px-1.5"
              >
                ×
              </button>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="pointer-events-auto p-4 bg-red-600 dark:bg-red-950/95 backdrop-blur-md border border-red-500/20 text-white rounded-2xl flex items-center gap-3 shadow-xl font-bold text-xs"
            >
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0 animate-pulse" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
              <button 
                onClick={() => setErrorMsg(null)} 
                className="text-white hover:opacity-80 transition-opacity font-black text-base cursor-pointer px-1.5"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800/85 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-teal-600 to-emerald-400 rounded-xl flex items-center justify-center shadow-sm">
            <NutriAlertaLogo className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">
              Nutri <span className="text-teal-500 font-apple-cursive text-2xl tracking-wide select-none">for Schools</span>
            </h1>
            <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Mapeamento Escolar</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status badge */}
          <div className={`hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-colors ${
            dbStatus === 'connected' ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
            dbStatus === 'error' ? 'bg-red-500/5 dark:bg-red-500/10 border-red-500/10 dark:border-red-500/20 text-red-650 dark:text-red-400' :
            'bg-slate-50/5 dark:bg-zinc-800/10 border-slate-200 dark:border-zinc-800 text-slate-550 dark:text-zinc-400'
          }`}>
            {dbStatus === 'checking' && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-slate-450 dark:text-zinc-500" />
                <span>Verificando Banco</span>
              </>
            )}
            {dbStatus === 'connected' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-550 dark:bg-emerald-400 animate-pulse" />
                <span>Supabase Conectado</span>
              </>
            )}
            {dbStatus === 'error' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-ping" />
                <span>Erro de Banco</span>
              </>
            )}
          </div>

          {/* Epidemiological Dashboard Link (Redirects to port 3000) */}
          <a
            href={nutrialertaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500/10 to-teal-500/10 hover:from-indigo-500/20 hover:to-teal-500/20 border border-indigo-500/20 rounded-xl transition-all text-[10px] font-black text-indigo-700 dark:text-indigo-300 shadow-sm cursor-pointer"
            title="Ir para o Portal de Gestão NutriAlerta (Análise Epidemiológica)"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Painel Epidemiológico</span>
          </a>

          {/* Current School/Admin Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/10 dark:border-teal-500/20 rounded-xl">
            {isSuperAdmin ? (
              <>
                <Settings className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-xs font-black text-teal-700 dark:text-teal-300">
                  Superadmin
                </span>
              </>
            ) : (
              <>
                <School className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-black text-teal-700 dark:text-teal-300 truncate max-w-[220px]">
                  {schoolName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-xl border border-slate-250 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 cursor-pointer transition-colors"
            title="Alternar Tema"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-teal-600" />}
          </button>

          <button
            onClick={handleLogout}
            className="px-3 h-9 rounded-xl border border-slate-250 dark:border-zinc-800 hover:bg-red-500/10 dark:hover:bg-red-500/10 flex items-center gap-1.5 text-slate-600 dark:text-zinc-350 hover:text-red-650 dark:hover:text-red-400 cursor-pointer font-bold text-xs transition-colors"
            title="Sair do Portal"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Container bifurcation */}
      {isSuperAdmin ? (
        /* ==================== SUPERADMIN CONSOLE ==================== */
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          
          {/* Top Info Banner */}
          <div className="p-4 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 rounded-3xl flex items-center gap-3">
            <Shield className="w-5 h-5 text-teal-500 flex-shrink-0 animate-pulse" />
            <div>
              <h3 className="text-xs font-black text-teal-800 dark:text-teal-300 uppercase tracking-wider">Modo de Configuração do Sistema</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Você está conectado como o Administrador Geral. Cadastre novas escolas na rede municipal e crie as credenciais de acesso das secretarias escolares.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Unified School + Login Form */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-3 mb-5">
                  Cadastrar Escola e Acesso
                </h3>

                <form onSubmit={handleCreateSchoolAndAccount} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5" htmlFor="schoolNameInput">
                      Nome da Escola
                    </label>
                    <input
                      id="schoolNameInput"
                      type="text"
                      required
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      placeholder="Ex: Escola Municipal João Doe"
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-250 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all text-slate-800 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5" htmlFor="schoolBairroInput">
                      Bairro / Localidade
                    </label>
                    <input
                      id="schoolBairroInput"
                      type="text"
                      required
                      value={newSchoolBairro}
                      onChange={(e) => setNewSchoolBairro(e.target.value)}
                      placeholder="Ex: Centro"
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-250 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all text-slate-800 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5" htmlFor="userEmailInput">
                      E-mail de Acesso (Escola)
                    </label>
                    <input
                      id="userEmailInput"
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="escola@rioclaro.sp.gov.br"
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-250 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all text-slate-800 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5" htmlFor="userPasswordInput">
                      Senha de Acesso
                    </label>
                    <input
                      id="userPasswordInput"
                      type="password"
                      required
                      minLength={6}
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Min. 6 caracteres"
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-250 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all text-slate-800 dark:text-white font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingSchool}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {creatingSchool ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Cadastrar Escola e Acesso
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Tabbed List Table (Schools vs. Logins) */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-3xl shadow-sm overflow-hidden">
                {/* Tab Selector Inside the Table Card */}
                <div className="flex gap-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 px-4 pt-3">
                  <button
                    onClick={() => setActiveTab('schools')}
                    className={`pb-2 px-3 text-[10px] font-black tracking-wider uppercase border-b-2 cursor-pointer transition-all ${
                      activeTab === 'schools'
                        ? 'border-teal-500 text-teal-655 dark:text-teal-400'
                        : 'border-transparent text-slate-450 dark:text-zinc-500 hover:text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5" />
                      Escolas ({schools.length})
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className={`pb-2 px-3 text-[10px] font-black tracking-wider uppercase border-b-2 cursor-pointer transition-all ${
                      activeTab === 'accounts'
                        ? 'border-teal-500 text-teal-655 dark:text-teal-400'
                        : 'border-transparent text-slate-450 dark:text-zinc-500 hover:text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      Contas de Acesso ({createdAccounts.length})
                    </span>
                  </button>
                </div>

                <div className="p-0">
                  {activeTab === 'schools' ? (
                    /* TAB 1: LIST SCHOOLS */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/20 dark:bg-zinc-950/10 text-[9px] text-slate-450 dark:text-zinc-500 uppercase font-black tracking-wider border-b border-slate-100 dark:border-zinc-800">
                            <th className="px-5 py-3">#ID</th>
                            <th className="px-5 py-3">Nome da Escola</th>
                            <th className="px-5 py-3">Bairro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                          {loadingSchools ? (
                            <tr>
                              <td colSpan={3} className="px-6 py-10 text-center text-slate-400 dark:text-zinc-550 font-bold">
                                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-teal-500" />
                                Carregando escolas...
                              </td>
                            </tr>
                          ) : schools.length > 0 ? (
                            schools.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-55/30 dark:hover:bg-zinc-950/30 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-zinc-300">
                                  #{s.id}
                                </td>
                                <td className="px-5 py-3.5 text-slate-850 dark:text-zinc-200 font-bold">
                                  {s.nome}
                                </td>
                                <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400 font-semibold">
                                  {s.bairro}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-10 text-center text-slate-400 dark:text-zinc-550">
                                Nenhuma escola cadastrada ainda.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* TAB 2: LIST CREATED ACCOUNTS */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/20 dark:bg-zinc-950/10 text-[9px] text-slate-450 dark:text-zinc-550 uppercase font-black tracking-wider border-b border-slate-100 dark:border-zinc-800">
                            <th className="px-5 py-3">E-mail</th>
                            <th className="px-5 py-3">Escola Vinculada</th>
                            <th className="px-5 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                          {createdAccounts.length > 0 ? (
                            createdAccounts.map((acc, index) => (
                              <tr key={index} className="hover:bg-slate-55/30 dark:hover:bg-zinc-950/30 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-slate-850 dark:text-zinc-200">
                                  {acc.email}
                                </td>
                                <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400 font-semibold">
                                  {acc.school_name}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 uppercase tracking-wider">
                                    Ativo
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-10 text-center text-slate-400 dark:text-zinc-550 font-medium">
                                Nenhuma conta criada recentemente.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* ==================== REGULAR SCHOOL USER PORTAL ==================== */
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* PRIMARY ZONE: Focus on Registration Form (Centered & Large) */}
          <section className="max-w-2xl mx-auto w-full">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-4 sm:p-8 rounded-3xl shadow-sm transition-shadow duration-300 hover:shadow-md relative overflow-hidden">
              
              {/* Ambient Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    Registrar Medição de Aluno
                    <span className="px-2 py-0.5 bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/10 rounded-md text-[9px] font-black flex items-center gap-0.5 uppercase tracking-normal">
                      <Shield className="w-2.5 h-2.5" />
                      LGPD
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Preencha os dados de saúde anuais para cálculo imediato de IMC.</p>
                </div>
              </div>

              {/* Individual Form */}
              <form onSubmit={handleRegister} className="space-y-5">
                
                {/* Row 1: Idade & Gênero */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2" htmlFor="ageInput">
                      Idade (Anos)
                    </label>
                    <input
                      id="ageInput"
                      ref={ageInputRef}
                      type="number"
                      required
                      min="2"
                      max="19"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Ex: 8"
                      className="w-full px-4 py-3 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-250 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all text-slate-800 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                      Gênero do Aluno
                    </label>
                    
                    {/* Apple-style Segmented Selector */}
                    <div className="relative flex p-1 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl w-full">
                      <button
                        type="button"
                        onClick={() => setGender('M')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all duration-200 ${
                          gender === 'M'
                            ? 'bg-white dark:bg-zinc-800 text-teal-655 dark:text-teal-400 shadow-sm border border-slate-200/50 dark:border-zinc-700/50'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        Masculino (M)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('F')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all duration-200 ${
                          gender === 'F'
                            ? 'bg-white dark:bg-zinc-800 text-teal-655 dark:text-teal-400 shadow-sm border border-slate-200/50 dark:border-zinc-700/50'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        Feminino (F)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Peso & Altura */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2" htmlFor="weightInput">
                      Peso (kg)
                    </label>
                    <input
                      id="weightInput"
                      type="number"
                      step="0.1"
                      required
                      min="4"
                      max="200"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Ex: 34.5"
                      className="w-full px-4 py-3 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-250 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all text-slate-800 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2" htmlFor="heightInput">
                      Altura (Metros)
                    </label>
                    <input
                      id="heightInput"
                      type="number"
                      step="0.01"
                      required
                      min="0.5"
                      max="2.3"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Ex: 1.32"
                      className="w-full px-4 py-3 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-250 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all text-slate-800 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                {/* Real-time calculated BMI Feedback */}
                <AnimatePresence>
                  {imc !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800/80 rounded-2xl flex items-center justify-between shadow-inner"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-zinc-550 font-black uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                          IMC Calculado
                        </div>
                        <span className="text-3xl font-black tracking-tight text-slate-800 dark:text-white mt-1 block">
                          {imc}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-[9px] text-slate-400 dark:text-zinc-550 font-black uppercase tracking-wider mb-1.5">
                          Classificação
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${imcColor} shadow-sm`}>
                          {imcClassification}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-505 hover:from-teal-500 hover:to-emerald-400 text-white rounded-2xl font-bold text-xs shadow-md shadow-teal-500/5 hover:shadow-teal-500/15 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Gravando dados...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Salvar Registro (Enter)
                    </>
                  )}
                </button>

              </form>

              {/* Collapsible CSV Upload Section */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCsv(!showCsv)}
                  className="w-full flex items-center justify-between text-xs font-black text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-teal-500" />
                    Importação em Lote (CSV)
                  </span>
                  {showCsv ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showCsv && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-4 pt-3"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-450 dark:text-zinc-555">Envie múltiplos registros de uma vez</span>
                        <button
                          type="button"
                          onClick={downloadTemplate}
                          className="text-teal-600 dark:text-teal-400 hover:underline font-bold"
                        >
                          Baixar Modelo CSV
                        </button>
                      </div>

                      {/* Tabela de exemplo padrão */}
                      <div className="bg-slate-100/50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
                        <div className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          Estrutura Padrão do Arquivo CSV
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[10px] font-semibold text-slate-600 dark:text-zinc-300">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-zinc-800 text-[9px] text-slate-400 dark:text-zinc-550 uppercase font-black">
                                <th className="pb-1.5 pr-2">genero</th>
                                <th className="pb-1.5 pr-2">idade</th>
                                <th className="pb-1.5 pr-2">peso</th>
                                <th className="pb-1.5">altura</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-zinc-800/30">
                              <tr>
                                <td className="py-1 pr-2">M</td>
                                <td className="py-1 pr-2">8</td>
                                <td className="py-1 pr-2">28.5 <span className="text-[9px] text-slate-400 dark:text-zinc-500">(ou 28,5)</span></td>
                                <td className="py-1">1.26 <span className="text-[9px] text-slate-400 dark:text-zinc-500">(ou 1,26)</span></td>
                              </tr>
                              <tr>
                                <td className="py-1 pr-2">F</td>
                                <td className="py-1 pr-2">9</td>
                                <td className="py-1 pr-2">34.2</td>
                                <td className="py-1">1.35</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-zinc-500 leading-relaxed">
                          * Certifique-se de que a primeira linha contém exatamente os cabeçalhos acima. O sistema aceita ponto ou vírgula como separador decimal.
                        </div>
                      </div>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-slate-200 dark:border-zinc-800 hover:border-teal-500 dark:hover:border-teal-500/50 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-850/10 transition-colors flex flex-col items-center justify-center"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept=".csv"
                          onChange={handleCsvChange}
                          className="hidden"
                        />
                        <Upload className="w-7 h-7 text-slate-400 dark:text-zinc-650 mb-2" />
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          {csvFile ? csvFile.name : 'Selecionar arquivo .csv'}
                        </span>
                      </div>

                      {csvError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl text-red-500 text-[10px] font-semibold flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{csvError}</span>
                        </div>
                      )}

                      {csvData.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-[10px] font-black text-slate-400 uppercase">Pré-visualização ({csvData.length} registros)</div>
                          <button
                            type="button"
                            onClick={handleBulkSubmit}
                            disabled={submitting}
                            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Importando...
                              </>
                            ) : (
                              <>
                                Confirmar Envio em Lote ({csvData.length} alunos)
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </section>

          {/* SECONDARY ZONE: Histórico e Indicadores (Slightly smaller, grouped below) */}
          <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-zinc-800/80">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Histórico & Estatísticas</h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Indicadores da escola e listagem dos registros inseridos.</p>
              </div>
              
              {/* Quick Metrics Inline */}
              <div className="flex gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm min-w-[140px]">
                  <div className="w-7 h-7 bg-teal-500/10 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider">Total Alunos</p>
                    <h4 className="text-sm font-black text-slate-855 dark:text-white mt-0.5">{totalCount}</h4>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm min-w-[140px]">
                  <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider">Média IMC</p>
                    <h4 className="text-sm font-black text-slate-855 dark:text-white mt-0.5">{avgImc}</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-3xl shadow-sm overflow-hidden flex flex-col">
              
              {/* Filter Bar */}
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row gap-3">
                {/* Search by ID */}
                <div className="relative flex-1">
                  <Search className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-zinc-500 w-3.5 h-3.5 my-auto" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por ID do Aluno..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-teal-500 transition-all text-slate-855 dark:text-white font-semibold"
                  />
                </div>

                {/* Filters dropdowns */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="bg-transparent text-[11px] font-black text-slate-655 dark:text-zinc-350 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">Todos os Gêneros</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-transparent text-[11px] font-black text-slate-655 dark:text-zinc-350 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">Todos os Status</option>
                      <option value="NORMAL">Peso Ideal</option>
                      <option value="ALERT">Alertas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-zinc-950/40 text-[9px] text-slate-450 dark:text-zinc-500 uppercase font-black tracking-wider border-b border-slate-100 dark:border-zinc-800">
                      <th className="px-5 py-3">#ID Aluno</th>
                      <th className="px-5 py-3">Data da Coleta</th>
                      <th className="px-5 py-3">Gênero</th>
                      <th className="px-5 py-3">Idade</th>
                      <th className="px-5 py-3">Peso / Altura</th>
                      <th className="px-5 py-3">IMC</th>
                      <th className="px-5 py-3">Status Nutricional</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => {
                        const status = getImcStatus(record.imc);
                        return (
                          <tr key={record.id} className="hover:bg-slate-55/30 dark:hover:bg-zinc-950/30 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-zinc-300">
                              #{record.id}
                            </td>
                            <td className="px-5 py-3.5 text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                              {new Date(record.data_coleta).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400 font-semibold">
                              {record.genero === 'M' ? 'M' : 'F'}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400 font-semibold">
                              {record.idade ? `${record.idade} anos` : '-'}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                              {record.peso}kg / {record.altura}m
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-zinc-200">
                              {record.imc}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="p-1.5 border border-slate-200 dark:border-zinc-800 hover:border-red-500/30 hover:text-red-500 rounded-lg text-slate-400 dark:text-zinc-500 cursor-pointer transition-colors"
                                title="Excluir Registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-slate-400 dark:text-zinc-550 font-medium">
                          Nenhum registro de saúde cadastrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </section>

        </main>
      )}
    </div>
  );
}
