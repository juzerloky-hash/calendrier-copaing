"use client";
import { useState } from "react";
import Modal from "./Modal";
import { STATUS, colorOf, fmtLong } from "../lib/utils";

export default function DayModal({ date, entries, me, onSave, onClear, onClose }) {
  const mine = entries.find((e) => e.user_id === me.uid);
  const [status, setStatus] = useState(mine?.status || "ok");
  const [note, setNote] = useState(mine?.note || "");
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    await fn();
    setBusy(false);
    onClose();
  };

  return (
    <Modal onClose={onClose} label={fmtLong(date)}>
      <h3>{fmtLong(date)}</h3>
      <ul className="who">
        {entries.length === 0 && <li className="muted">Personne n’a répondu pour ce jour.</li>}
        {entries.map((e) => (
          <li key={e.user_id}>
            <i
              className={"dot" + (e.status === "maybe" ? " ring" : "") + (e.status === "no" ? " off" : "")}
              style={{ "--c": colorOf(e.user_id) }}
            />
            <span>
              {e.name} · {STATUS[e.status]}
              {e.note ? ` — ${e.note}` : ""}
            </span>
          </li>
        ))}
      </ul>

      <div className="seg" role="group" aria-label="Ma disponibilité">
        {Object.entries(STATUS).map(([k, label]) => (
          <button key={k} type="button" data-s={k} aria-pressed={status === k} onClick={() => setStatus(k)}>
            {label}
          </button>
        ))}
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Précision (ex. après 18h)" />

      <div className="row">
        <button className="primary" disabled={busy} onClick={() => run(() => onSave([date], status, note))}>
          Enregistrer
        </button>
        <button className="ghost" disabled={!mine || busy} onClick={() => run(() => onClear([date]))}>
          Effacer ma réponse
        </button>
        <button className="ghost" onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  );
}
