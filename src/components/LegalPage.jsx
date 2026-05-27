import React from 'react';

const S = {
  page: { background: '#060a12', color: '#f1f5f9', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: '100vh', padding: '80px 0 60px' },
  container: { maxWidth: 800, margin: '0 auto', padding: '0 24px' },
  h1: { fontSize: 36, fontWeight: 900, marginBottom: 8, color: '#f1f5f9' },
  h2: { fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12, color: '#a3e635' },
  p: { fontSize: 15, color: '#94a3b8', lineHeight: 1.8, marginBottom: 16 },
  back: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 40, textDecoration: 'none' },
  date: { fontSize: 13, color: '#475569', marginBottom: 40 },
};

export function PrivacyPage({ onBack }) {
  return (
    <div style={S.page}>
      <div style={S.container}>
        <button onClick={onBack} style={S.back}>← Retour</button>
        <h1 style={S.h1}>Politique de confidentialité</h1>
        <p style={S.date}>Dernière mise à jour : mai 2026</p>

        <h2 style={S.h2}>1. Responsable du traitement</h2>
        <p style={S.p}>FootPlanner est édité par Cyril Charton, particulier domicilié en France métropolitaine. Contact : contact@footplanner.fr</p>

        <h2 style={S.h2}>2. Données collectées</h2>
        <p style={S.p}>Lors de votre inscription, nous collectons : prénom, nom, adresse email, nom du club, numéro de téléphone (optionnel). Ces données sont nécessaires au fonctionnement du service.</p>
        <p style={S.p}>Dans le cadre de l'utilisation de l'application, nous collectons également les données relatives aux tournois que vous créez (équipes, matchs, résultats).</p>

        <h2 style={S.h2}>3. Finalité du traitement</h2>
        <p style={S.p}>Vos données sont utilisées exclusivement pour : la création et gestion de votre compte, le fonctionnement du service FootPlanner, et vous contacter en cas de besoin lié au service.</p>

        <h2 style={S.h2}>4. Hébergement des données</h2>
        <p style={S.p}>Vos données sont hébergées par Supabase (Union Européenne) et Vercel (États-Unis, avec garanties RGPD). Ces prestataires sont soumis à des obligations strictes de confidentialité.</p>

        <h2 style={S.h2}>5. Durée de conservation</h2>
        <p style={S.p}>Vos données sont conservées pendant toute la durée de votre utilisation du service, et supprimées dans un délai de 30 jours suivant la clôture de votre compte.</p>

        <h2 style={S.h2}>6. Vos droits</h2>
        <p style={S.p}>Conformément au RGPD, vous disposez des droits d'accès, de rectification, de suppression, de portabilité et d'opposition concernant vos données personnelles. Pour exercer ces droits, contactez-nous à : contact@footplanner.fr</p>

        <h2 style={S.h2}>7. Cookies</h2>
        <p style={S.p}>FootPlanner utilise uniquement des cookies techniques nécessaires au fonctionnement du service (authentification). Aucun cookie publicitaire ou de tracking n'est utilisé.</p>
      </div>
    </div>
  );
}

export function CGUPage({ onBack }) {
  return (
    <div style={S.page}>
      <div style={S.container}>
        <button onClick={onBack} style={S.back}>← Retour</button>
        <h1 style={S.h1}>Conditions Générales d'Utilisation</h1>
        <p style={S.date}>Dernière mise à jour : mai 2026</p>

        <h2 style={S.h2}>1. Présentation du service</h2>
        <p style={S.p}>FootPlanner est une application web de gestion de tournois de football, accessible à l'adresse footplanner.fr. Le service est édité par Cyril Charton, particulier domicilié en France.</p>

        <h2 style={S.h2}>2. Accès au service</h2>
        <p style={S.p}>L'accès au service nécessite la création d'un compte. L'inscription est actuellement gratuite dans le cadre de la période beta. FootPlanner se réserve le droit de modifier les conditions tarifaires à l'issue de cette période, avec un préavis de 30 jours.</p>

        <h2 style={S.h2}>3. Responsabilités de l'utilisateur</h2>
        <p style={S.p}>L'utilisateur est responsable des données qu'il saisit dans l'application (équipes, joueurs, résultats). Il s'engage à ne pas utiliser le service à des fins illicites et à respecter les droits des tiers.</p>

        <h2 style={S.h2}>4. Disponibilité du service</h2>
        <p style={S.p}>FootPlanner s'efforce d'assurer la disponibilité du service 24h/24 et 7j/7. Des interruptions peuvent survenir pour maintenance ou en cas de force majeure. FootPlanner ne saurait être tenu responsable des dommages causés par une indisponibilité du service.</p>

        <h2 style={S.h2}>5. Propriété intellectuelle</h2>
        <p style={S.p}>Le code source, le design et les contenus de FootPlanner sont la propriété exclusive de Cyril Charton. Toute reproduction ou utilisation sans autorisation est interdite.</p>

        <h2 style={S.h2}>6. Données personnelles</h2>
        <p style={S.p}>Le traitement des données personnelles est décrit dans notre politique de confidentialité, accessible depuis le site.</p>

        <h2 style={S.h2}>7. Modification des CGU</h2>
        <p style={S.p}>FootPlanner se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par email en cas de modification substantielle.</p>

        <h2 style={S.h2}>8. Droit applicable</h2>
        <p style={S.p}>Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la compétence des tribunaux français.</p>

        <h2 style={S.h2}>9. Contact</h2>
        <p style={S.p}>Pour toute question : contact@footplanner.fr</p>
      </div>
    </div>
  );
}