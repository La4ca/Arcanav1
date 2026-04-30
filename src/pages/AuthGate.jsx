import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Lock, UserPlus, LogIn, Shield, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import arcanaLogo from '@/assets/logo/arcana.png';
import { useToast } from '@/components/ui/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { COL } from '@/lib/firestore';
import { Roles } from '@/utils/rbac';

const ROLES = [
  { value: Roles.Read,       label: 'Viewer — Read only access' },
  { value: Roles.Triage,     label: 'Auditor — Read + view logs' },
  { value: Roles.Write,      label: 'Developer — Read + write' },
  { value: Roles.Maintainer, label: 'Lead Developer — Manage + approve' },
  { value: Roles.Admin,      label: 'Admin — Full access' },
];

export default function AuthGate() {
  const navigate = useNavigate();
  const { login, currentUser, authLoading } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState(Roles.Read);
  const [loading, setLoading] = useState(false);

  // Guard with authLoading so we don't redirect while Firebase is still
  // resolving the persisted session from IndexedDB
  useEffect(() => {
    if (!authLoading && currentUser) navigate('/dashboard', { replace: true });
  }, [authLoading, currentUser, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      toast({
        title: 'Login failed',
        description: err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : err.message,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password || !username.trim()) return;
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive', duration: 5000 });
      return;
    }
    setLoading(true);
    try {
      // Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      // Save profile to Firestore using Firebase Auth UID
      await setDoc(doc(db, COL.USERS, uid), {
        username: username.trim(),
        email: email.trim(),
        role,
        avatar: username.trim()[0].toUpperCase(),
      });

      toast({ title: 'Account created!', description: `Welcome to Arcana, ${username.trim()}!` });
      navigate('/dashboard');
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err.code === 'auth/email-already-in-use'
          ? 'That email is already registered. Try logging in.'
          : err.message,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/2 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo + brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-20 h-20 rounded-2xl bg-card ring-1 ring-border/80 shadow-xl overflow-hidden flex items-center justify-center mx-auto mb-5"
          >
            <img src={arcanaLogo} alt="Arcana" className="w-full h-full object-cover" draggable={false} />
          </motion.div>
          <h1 className="text-2xl font-mono font-bold text-foreground tracking-tight">Arcana</h1>
          <p className="text-muted-foreground font-mono text-xs mt-1.5 tracking-wide">
            Secure Repository System
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/70 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-border/60">
            {[
              { id: 'login', label: 'Sign In', icon: LogIn },
              { id: 'register', label: 'Register', icon: UserPlus },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setEmail(''); setPassword(''); setUsername(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-mono font-medium transition-all ${
                  tab === id
                    ? 'text-foreground border-b-2 border-primary bg-secondary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {tab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@arcana.local"
                      className="font-mono text-sm bg-secondary/60 border-border/70 h-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="font-mono text-sm bg-secondary/60 border-border/70 h-10 pr-10"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !email.trim() || !password}
                    className="w-full font-mono text-sm h-10 bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-3.5 h-3.5 mr-2" />}
                    Sign In
                  </Button>

                  {/* Demo hint */}
                  <div className="rounded-lg bg-secondary/40 border border-border/50 p-3 space-y-1">
                    <p className="font-mono text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Demo Accounts</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {[
                        ['owner@arcana.local', 'Admin'],
                        ['dev@arcana.local', 'Developer'],
                        ['maintainer@arcana.local', 'Lead Dev'],
                        ['viewer@arcana.local', 'Viewer'],
                        ['auditor@arcana.local', 'Auditor'],
                      ].map(([em, role]) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => { setEmail(em); setPassword('arcana123'); }}
                          className="text-left font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground/50">Click a role to fill credentials · password: arcana123</p>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Username</Label>
                    <Input
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="johndoe"
                      className="font-mono text-sm bg-secondary/60 border-border/70 h-10"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="font-mono text-sm bg-secondary/60 border-border/70 h-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="font-mono text-sm bg-secondary/60 border-border/70 h-10 pr-10"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="font-mono text-xs bg-secondary/60 border-border/70 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => (
                          <SelectItem key={r.value} value={r.value} className="font-mono text-xs">{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !email.trim() || !password || !username.trim()}
                    className="w-full font-mono text-sm h-10 bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-3.5 h-3.5 mr-2" />}
                    Create Account
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-[10px] font-mono text-muted-foreground/60 mt-6">
          Arcana v1.0 · Firebase Auth · {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}