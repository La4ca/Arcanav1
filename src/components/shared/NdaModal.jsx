import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, AlertTriangle, FileText, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NdaModal({ open, onAccept }) {
  const [checked, setChecked] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleClose = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-lg bg-card border-border"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideClose
      >
        <DialogHeader>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <DialogTitle className="font-mono text-base font-bold text-foreground">
                Non-Disclosure Agreement
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleClose}
              title="Decline and return to login"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            Read and accept the NDA to continue. Closing will log you out.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <p className="font-mono text-[11px] text-amber-300 leading-relaxed">
            This system contains <strong>trade secret materials</strong>. Unauthorized access or disclosure
            is a criminal offence under the Defend Trade Secrets Act (DTSA).
          </p>
        </div>

        <ScrollArea className="h-48 rounded-md border border-border bg-secondary/40 p-4">
          <div className="font-mono text-[11px] text-muted-foreground space-y-3 leading-relaxed">
            <p className="text-foreground font-semibold">CONFIDENTIALITY & NON-DISCLOSURE AGREEMENT</p>
            <p>By accessing the <strong className="text-foreground">Arcana Repository System</strong>, you ("User") agree to the following terms:</p>
            <p><strong className="text-foreground">1. Confidential Information.</strong> All source code, algorithms, architecture documents, operational runbooks, credentials, and metadata accessible through this platform constitute proprietary trade secrets of the Organisation.</p>
            <p><strong className="text-foreground">2. Non-Disclosure.</strong> User shall not, directly or indirectly, disclose, reproduce, transmit, or make available any Confidential Information to any third party without prior written consent from an authorised Admin.</p>
            <p><strong className="text-foreground">3. Restricted Files.</strong> Files marked as RESTRICTED require explicit Just-In-Time (JIT) approval. Circumventing access controls constitutes a material breach.</p>
            <p><strong className="text-foreground">4. Audit & Monitoring.</strong> All access is logged. User acknowledges that activity within this system is monitored for security and compliance purposes.</p>
            <p><strong className="text-foreground">5. Duration.</strong> Obligations survive the termination of User's access for a period of two (2) years.</p>
            <p><strong className="text-foreground">6. Remedies.</strong> Breach of this agreement may result in immediate access revocation, civil damages, and/or criminal prosecution under applicable law.</p>
            <p><strong className="text-foreground">7. Governing Law.</strong> This agreement is governed by the laws of the jurisdiction in which the Organisation is incorporated.</p>
            <p className="text-[10px] text-muted-foreground/60 pt-2">Arcana NDA v1.0 · Effective 2026</p>
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-1">
          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={checked}
              onCheckedChange={setChecked}
              className="mt-0.5 border-border data-[state=checked]:bg-primary"
            />
            <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
              I have read, understand, and agree to the Non-Disclosure Agreement and acknowledge that
              all content on this platform is confidential and subject to trade secret protection.
            </span>
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="font-mono text-xs border-border text-muted-foreground hover:text-foreground"
              onClick={handleClose}
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Decline & Exit
            </Button>
            <Button
              onClick={onAccept}
              disabled={!checked}
              className="flex-1 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Accept & Enter System
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
