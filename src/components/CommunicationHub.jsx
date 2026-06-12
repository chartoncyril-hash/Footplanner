import React, { useState, useEffect } from 'react';
import { MessageSquare, CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getEffectiveOwnerId } from '../lib/effectiveUser';
import { ChatModule } from './chat/ChatModule';
import { CommunicationView } from './CommunicationView';

// Communication = Messages (chat WhatsApp-like) + Événements (existant, récurrence incluse)
export function CommunicationHub() {
  const [tab, setTab] = useState('messages');
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ownerId = await getEffectiveOwnerId();
      let senderName = (user.email || '').split('@')[0] || 'Staff';
      try {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (prof && prof.first_name) senderName = prof.first_name;
        else {
          const { data: mem } = await supabase.from('club_members').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle();
          if (mem && (mem.first_name || mem.name)) senderName = mem.first_name ? (mem.first_name + (mem.last_name ? ' ' + mem.last_name : '')) : mem.name;
        }
      } catch (e) { /* fallback email */ }
      setCtx({ user, ownerId, senderName });
    })();
  }, []);

  const tabBtn = (id, label, Icon) => (
    <button onClick={() => setTab(id)} style={{
      display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
      borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
      background: tab === id ? 'rgba(163,230,53,0.12)' : 'transparent',
      border: '1px solid ' + (tab === id ? 'rgba(163,230,53,0.4)' : 'rgba(255,255,255,0.07)'),
      color: tab === id ? '#a3e635' : '#64748b',
    }}>
      <Icon size={15} /> {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {tabBtn('messages', 'Messages', MessageSquare)}
        {tabBtn('events', 'Événements', CalendarDays)}
      </div>
      {tab === 'messages' && (
        ctx ? (
          <ChatModule user={ctx.user} clubOwnerId={ctx.ownerId} isStaff={true} senderName={ctx.senderName} accent="#a3e635" />
        ) : (
          <div style={{ padding: 30, color: '#475569', fontSize: 13 }}>Chargement…</div>
        )
      )}
      {tab === 'events' && <CommunicationView />}
    </div>
  );
}
