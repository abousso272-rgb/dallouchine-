import React from 'react';
import { Compass } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/States';

export default function NotFoundPage() {
  return (
    <div className="container-page max-w-xl py-16">
      <div className="card">
        <EmptyState
          icon={<Compass className="h-5 w-5" />}
          title="Page introuvable"
          description="Le lien est peut-être incorrect ou la page a été déplacée."
          action={
            <div className="flex gap-2">
              <Button to="/">Accueil</Button>
              <Button to="/catalogue" variant="secondary">
                Catalogue
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
