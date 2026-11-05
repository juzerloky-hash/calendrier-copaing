"use client";
import { useState } from "react";
import Modal from "./Modal";
import { NAMES } from "../lib/utils";

export default function NameModal({ initial = "", onSubmit, onClose }) {
  const [value, setValue] = useState(NAMES.includes(initial) ? initial : "");
  return (
    <Modal onClose={onClose} label="Qui es-tu ?">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value) onSubmit(value);
        }}
      >
        <h3>Qui es-tu ?</h3>
        <p className="muted">Choisis ton prénom : il s’affichera à côté de tes dispos.</p>
        <label className="field">
          <span className="sr-only">Prénom</span>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            autoFocus
          >
            <option value="" disabled>
              Choisir un prénom
            </option>
            {NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <button className="primary" type="submit" disabled={!value}>Valider</button>
          <button className="ghost" type="button" onClick={onClose}>Annuler</button>
        </div>
      </form>
    </Modal>
  );
}
