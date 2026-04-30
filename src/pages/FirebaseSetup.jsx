import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { seedDatabase, getSeedUsers } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Loader2, Database, Shield } from 'lucide-react';
import arcanaLogo from '@/assets/logo/arcana.png';
import { motion } from 'framer-motion';

export default function FirebaseSetup() {
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState('');

  const addStep = (msg, ok = true) => {
    setSteps(prev => [...prev, { msg, ok }]);
  };

  const runSetup = async () => {
    setStatus('running');
    setSteps([]);
    setError('');

    try {
      // 1. Create Firebase Auth accounts
      addStep('Creating Firebase Auth accounts…');
      const seedUsers = getSeedUsers();
      for (const u of seedUsers) {
        try {
          await createUserWithEmailAndPassword(auth, u.email, u.password);
          addStep(`  ✓ Auth account: ${u.email}`);
        } catch (err) {
          if (err.code === 'auth/email-already-in-use') {
            addStep(`  ↩ Already exists: ${u.email}`);
          } else {
            throw err;
          }
        }
      }

      // 2. Seed Firestore collections
      addStep('Seeding Firestore collections…');
      await seedDatabase();
      addStep('  ✓ users, repos, repoAccess, files, commits, logs — seeded');

      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-card/70 ring-1 ring-border overflow-hidden flex items-center justify-center mx-auto mb-4">
            <img src={arcanaLogo} alt="Arcana" className="w-full h-full object-cover" draggable={false} />
          </div>
          <h1 className="text-2xl font-mono font-bold text-foreground">Firebase Setup</h1>
          <p className="text-muted-foreground font-mono text-sm mt-2">
            One-time initialisation — run this once after configuring Firebase
          </p>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
              <Database className="w-3.5 h-3.5" />
              <span>Seed Firebase Auth + Firestore</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* What this does */}
            <div className="rounded-lg bg-secondary/60 border border-border p-3 space-y-1.5">
              <p className="font-mono text-xs font-semibold text-foreground">This will:</p>
              {[
                'Create 5 Firebase Auth accounts (email/password)',
                'Seed users, repos, files, commits, logs in Firestore',
                'Skip any accounts/documents that already exist',
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Shield className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <span className="font-mono text-xs text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>

            {/* Prerequisite warning */}
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p className="font-mono text-[11px] text-amber-300">
                Make sure you have set your Firebase config in <code>src/lib/firebase.js</code> and
                enabled <strong>Email/Password</strong> sign-in in Firebase Console → Authentication.
              </p>
            </div>

            {/* Run button */}
            {status === 'idle' && (
              <Button onClick={runSetup} className="w-full font-mono bg-primary text-primary-foreground">
                <Database className="w-4 h-4 mr-2" /> Run Setup
              </Button>
            )}

            {status === 'running' && (
              <Button disabled className="w-full font-mono">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Running…
              </Button>
            )}

            {/* Step log */}
            {steps.length > 0 && (
              <div className="rounded-lg bg-secondary/60 border border-border p-3 max-h-64 overflow-y-auto">
                {steps.map((s, i) => (
                  <div key={i} className={`font-mono text-[11px] leading-relaxed ${s.ok ? 'text-muted-foreground' : 'text-red-400'}`}>
                    {s.msg}
                  </div>
                ))}
              </div>
            )}

            {/* Done */}
            {status === 'done' && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-mono text-xs text-emerald-300 font-semibold">Setup complete!</p>
                  <p className="font-mono text-[11px] text-emerald-300/80 mt-0.5">
                    Navigate to <a href="/" className="underline">the login page</a> and sign in with any quick-login button. Password for all accounts is <code>arcana123</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-mono text-xs text-red-400 font-semibold">Setup failed</p>
                  <p className="font-mono text-[11px] text-red-400/80 mt-0.5">{error}</p>
                  <Button onClick={runSetup} size="sm" variant="outline" className="font-mono text-xs mt-2">
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs font-mono text-muted-foreground mt-6">
          After setup, you can delete this page or leave it — it's idempotent.
        </p>
      </motion.div>
    </div>
  );
}
