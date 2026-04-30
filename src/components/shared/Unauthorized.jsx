import React from 'react';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <ShieldOff className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-mono font-bold text-foreground">ACCESS DENIED</h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            You do not have permission to view this page.
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="font-mono">
            ← Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}