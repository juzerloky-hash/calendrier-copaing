"use client";
import { useState } from "react";
import Modal from "./Modal";

export default function NameModal({ initial = "", onSubmit, onClose }) {
  const [value, setValue] = useState(initial);
  return (
    <Modal onClose={onClose} label="Ton prénom">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = value.trim();
          if (v) onSubmit(v.slice(0, 30));
        }}
      >
        <h3>Ton prénom</h3>
        <p className="muted">Il s’affichera à côté de tes dispos.</p>
        <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={30} required autoFocus placeholder="Julien" autoComplete="given-name" />
        <div className="row">
          <button className="primary" type="submit">Valider</button>
          <button className="ghost" type="button" onClick={onClose}>Annuler</button>
        </div>
      </form>
    </Modal>
  );
}
