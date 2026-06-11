import { supabase } from '../../../lib/supabase';
import type { AuditAction, Role } from './types';

interface AuditActor {
  id: string;
  name: string;
  role: Role;
}

export async function logAudit(
  actor: AuditActor,
  action: AuditAction,
  target: string,
  metadata?: Record<string, any>
) {
  try {
    await supabase.from('audit_logs').insert({
      action,
      actor_id: actor.id,
      actor_name: actor.name,
      actor_role: actor.role,
      target,
      metadata: metadata ?? null,
    });
  } catch (e) {
    // Audit logging should never break the app
    console.warn('Audit log failed:', e);
  }
}
