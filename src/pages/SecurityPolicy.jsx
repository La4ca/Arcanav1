import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, FileText, AlertTriangle, CheckCircle2,
  Scale, Eye, Key, Server, ClipboardList, ChevronDown, ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const Section = ({ icon: Icon, title, color = 'text-primary', children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="bg-card/95 border-border/70">
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="font-mono text-sm font-semibold text-foreground">{title}</span>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-3 text-sm font-mono text-muted-foreground leading-relaxed">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

const Item = ({ label, value, badge }) => (
  <div className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
    <span className="text-foreground/80 min-w-[180px] shrink-0">{label}</span>
    {badge ? (
      <Badge variant="outline" className="text-[10px] font-mono">{value}</Badge>
    ) : (
      <span>{value}</span>
    )}
  </div>
);

export default function SecurityPolicy() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Security & Legal Policy
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-1">
            Trade Secret Protection · Non-Disclosure Agreement · Technical Security Controls
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> v1.0 — Effective 2026
        </Badge>
      </div>

      {/* Summary ribbon */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="font-mono text-xs text-amber-300 leading-relaxed">
          <strong>Confidential — Internal Use Only.</strong> All code, data, and metadata stored within
          Arcana is considered proprietary information. Unauthorized access, disclosure, or reproduction
          is strictly prohibited and may constitute a criminal offence under applicable trade-secret laws.
        </p>
      </div>

      {/* Sections */}
      <Section icon={Scale} title="1. Legal Framework & Trade Secret Definition" color="text-blue-400" defaultOpen>
        <p>
          Arcana operates under the <strong className="text-foreground">Uniform Trade Secrets Act (UTSA)</strong> and
          the <strong className="text-foreground">Defend Trade Secrets Act (DTSA)</strong>. A trade secret is
          any information that derives independent economic value from not being generally known and is the subject
          of reasonable measures to keep it secret.
        </p>
        <p>
          Source code, algorithms, system architecture, runbooks, and operational configurations stored in
          sensitive repositories are classified as trade secrets. All users are legally bound to:
        </p>
        <ul className="list-disc ml-5 space-y-1 text-xs">
          <li>Maintain confidentiality of all accessed materials.</li>
          <li>Not reproduce, share, or transmit restricted content outside the platform.</li>
          <li>Report suspected breaches immediately to the Admin.</li>
          <li>Comply with the Non-Disclosure Agreement (NDA) signed upon onboarding.</li>
        </ul>
      </Section>

      <Section icon={FileText} title="2. Non-Disclosure Agreement (NDA) Summary" color="text-purple-400">
        <p>By accessing the Arcana platform, all users acknowledge and agree to the following NDA terms:</p>
        <div className="mt-3 space-y-1 bg-secondary/60 rounded-lg p-4 border border-border/50">
          <Item label="Effective Period" value="Duration of employment + 2 years post-separation" />
          <Item label="Covered Information" value="All code, configs, runbooks, credentials, design docs" />
          <Item label="Permitted Disclosure" value="None, except under Admin-granted written consent" />
          <Item label="Jurisdiction" value="Governing law of the organisation's principal office" />
          <Item label="Breach Consequences" value="Termination, civil damages, criminal prosecution" />
          <Item label="Trade Secret Files" value="Marked RESTRICTED — require explicit JIT approval" badge />
        </div>
        <p className="text-[11px] mt-2 text-muted-foreground/70">
          This summary is not a substitute for the full NDA. Users must retain a signed copy on file.
        </p>
      </Section>

      <Section icon={Lock} title="3. Encryption & Data Protection" color="text-emerald-400">
        <p>Arcana enforces multiple layers of encryption to protect trade secret content:</p>
        <div className="mt-3 space-y-1 bg-secondary/60 rounded-lg p-4 border border-border/50">
          <Item label="At-Rest Encryption" value="AES-256-GCM — all file content is encrypted on disk" />
          <Item label="In-Transit Encryption" value="TLS 1.3 — all API traffic is encrypted end-to-end" />
          <Item label="Key Management" value="Per-repository encryption keys, rotated every 90 days" />
          <Item label="Restricted Files" value="Additional layer: role-keyed envelope encryption" />
          <Item label="Session Tokens" value="HMAC-SHA256 signed JWTs, 1-hour expiry" />
          <Item label="JIT Access Grants" value="Time-limited (24h), cryptographically bound to user + file" />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          Files marked <span className="text-amber-300 font-semibold">RESTRICTED</span> undergo an additional
          access-control decryption step that requires an explicit approval from a Maintainer or Admin before
          the decryption key is issued to the requesting session.
        </p>
      </Section>

      <Section icon={Key} title="4. Role-Based Access Control (RBAC)" color="text-amber-400">
        <p>
          Arcana uses a five-tier RBAC model. Every action is evaluated against the user's global role and
          their per-repository role. The most permissive applicable role is effective.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-secondary/80">
                <th className="text-left p-2 border border-border/50 text-muted-foreground">Role</th>
                <th className="text-left p-2 border border-border/50 text-muted-foreground">View Repos</th>
                <th className="text-left p-2 border border-border/50 text-muted-foreground">Edit Files</th>
                <th className="text-left p-2 border border-border/50 text-muted-foreground">View Logs</th>
                <th className="text-left p-2 border border-border/50 text-muted-foreground">Approve JIT</th>
                <th className="text-left p-2 border border-border/50 text-muted-foreground">Admin Panel</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: 'Admin', view: '✓', edit: '✓', logs: '✓', jit: '✓', admin: '✓', color: 'text-red-400' },
                { role: 'Maintainer', view: '✓', edit: '✓', logs: '✓', jit: '✓', admin: '✗', color: 'text-purple-400' },
                { role: 'Developer (Write)', view: '✓', edit: '✓', logs: '✗', jit: '✗', admin: '✗', color: 'text-blue-400' },
                { role: 'Auditor (Triage)', view: '✓ (assigned)', edit: '✗', logs: '✓', jit: '✗', admin: '✗', color: 'text-amber-400' },
                { role: 'Viewer (Read)', view: '✓ (assigned)', edit: '✗', logs: '✗', jit: '✗', admin: '✗', color: 'text-slate-400' },
              ].map(r => (
                <tr key={r.role} className="border-b border-border/30">
                  <td className={`p-2 border border-border/50 font-semibold ${r.color}`}>{r.role}</td>
                  <td className="p-2 border border-border/50 text-center">{r.view}</td>
                  <td className="p-2 border border-border/50 text-center">{r.edit}</td>
                  <td className="p-2 border border-border/50 text-center">{r.logs}</td>
                  <td className="p-2 border border-border/50 text-center">{r.jit}</td>
                  <td className="p-2 border border-border/50 text-center">{r.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] mt-2 text-muted-foreground/70">
          Roles are assigned by Admins. Repo-specific roles override global roles for that repository only.
        </p>
      </Section>

      <Section icon={Eye} title="5. Activity Logging & Audit Trail" color="text-cyan-400">
        <p>
          All actions within Arcana are immutably logged. Audit trails are retained for a minimum of
          12 months and are accessible to Auditors, Maintainers, and Admins.
        </p>
        <div className="mt-3 space-y-1 bg-secondary/60 rounded-lg p-4 border border-border/50">
          <Item label="Logged Events" value="Login, file view, edit, access denied, JIT request/approval" />
          <Item label="Log Fields" value="Timestamp, username, action, repository, resource, IP, metadata" />
          <Item label="Tamper Protection" value="Append-only log store — no deletion or editing permitted" />
          <Item label="Export Format" value="CSV — signed with HMAC for integrity verification" />
          <Item label="Retention" value="12 months minimum; 7 years for trade-secret breach events" />
          <Item label="Access Control" value="Triage+ can read; only Admin can export full log archive" />
        </div>
      </Section>

      <Section icon={Server} title="6. Infrastructure & Incident Response" color="text-rose-400">
        <p>
          In the event of a suspected trade-secret breach or unauthorized access:
        </p>
        <ol className="list-decimal ml-5 space-y-1 text-xs mt-2">
          <li>The detecting party must notify the Admin within <strong className="text-foreground">1 hour</strong>.</li>
          <li>Admin immediately revokes the implicated user's session and access grants.</li>
          <li>A forensic audit of activity logs is conducted within <strong className="text-foreground">24 hours</strong>.</li>
          <li>Legal counsel is engaged for any confirmed breach.</li>
          <li>Affected repositories are placed in read-only lockdown pending review.</li>
          <li>All actions are documented in the incident runbook (<code className="text-foreground">ops-secrets/RUNBOOK.md</code>).</li>
        </ol>
        <p className="mt-3 text-[11px] text-muted-foreground/70">
          Incident reports must be submitted to the Compliance Officer within 72 hours of detection as required
          by applicable data-protection regulations.
        </p>
      </Section>

      <Section icon={ClipboardList} title="7. User Responsibilities & Acceptable Use" color="text-indigo-400">
        <ul className="list-disc ml-5 space-y-1 text-xs">
          <li>Access only the repositories and files you have been explicitly granted permission to view.</li>
          <li>Do not attempt to bypass role restrictions or file access controls.</li>
          <li>Do not copy, screenshot, or transmit restricted file contents outside the platform.</li>
          <li>Report any unintentional access to a restricted resource to the Admin immediately.</li>
          <li>JIT (Just-In-Time) access grants are temporary. Do not share or delegate JIT access.</li>
          <li>Credentials must not be shared. Each user is individually accountable for actions under their account.</li>
          <li>Violations will result in immediate access revocation and may lead to legal action.</li>
        </ul>
      </Section>

      <p className="text-center text-[11px] font-mono text-muted-foreground pt-2 pb-4">
        Arcana Security Policy · Version 1.0 · Effective 2026 · Reviewed Annually
      </p>
    </motion.div>
  );
}
