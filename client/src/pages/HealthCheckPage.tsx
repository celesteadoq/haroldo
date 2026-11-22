import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { fetchHealthStatus } from '../services/api';
import type { HealthCheckResponse } from '../types/api';

export function HealthCheckPage() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    async function checkApi() {
      try {
        setLoading(true);
        const data = await fetchHealthStatus();
        if (active) {
          setHealth(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Falha ao conectar à API.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void checkApi();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-brand-bg text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-xl border border-brand-border bg-brand-surface p-8 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold tracking-tight">
            biblio<span className="text-brand-primary">flix</span>
          </span>
          <span className="rounded-md bg-brand-elevated px-2.5 py-1 text-xs font-semibold text-brand-muted">
            Verificação Técnica
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold">Status do Ambiente</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Validação de conexão real entre frontend e backend via <code>GET /api/health</code>.
          </p>
        </div>

        {loading && (
          <div className="rounded-lg border border-brand-border bg-brand-bg p-4 text-sm text-brand-muted">
            Verificando conexão com <code>/api/health</code>...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-brand-primary bg-brand-promo p-4 text-sm text-white">
            <p className="font-semibold text-brand-accent">Erro na comunicação com a API</p>
            <p className="mt-1 text-brand-muted">{error}</p>
          </div>
        )}

        {!loading && health && (
          <div className="space-y-2 rounded-lg border border-brand-border bg-brand-bg p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-muted">Status da API:</span>
              <span className="font-semibold text-emerald-400">{health.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Banco de dados:</span>
              <span className="font-semibold text-emerald-400">{health.database}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Timestamp:</span>
              <span className="font-mono text-xs text-brand-muted">{health.timestamp}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Link to="/componentes">
            <Button variant="outline" size="sm">
              Ir para /componentes
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
