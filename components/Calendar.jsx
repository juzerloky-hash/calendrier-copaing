"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { STATUS, NAMES, colorOf, fmtLong, iso, uidForName } from "../lib/utils";
import DayModal from "./DayModal";
import NameModal from "./NameModal";

export default function Calendar() {
  const [ready, setReady] = useState(false);
  const [group, setGroup] = useState("copains");
  const [me, setMe] = useState({ uid: "", name: "" });
  const [today, setToday] = useState("");
  const [view, setView] = useState({ y: 2025, m: 0 });
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [openDay, setOpenDay] = useState(null);
  const [nameAsk, setNameAsk] = useState(null); // { then: fn | null }
  const [multi, setMulti] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [copied, setCopied] = useState(false);

  // Initialisation côté navigateur
  useEffect(() => {
    const now = new Date();
    setToday(iso(now.getFullYear(), now.getMonth(), now.getDate()));
    setView({ y: now.getFullYear(), m: now.getMonth() });
    const g = new URLSearchParams(window.location.search).get("g") || "copains";
    setGroup(g.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "copains");
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("cc-me")); } catch {}
    const name = NAMES.includes(saved?.name) ? saved.name : "";
    const m = { uid: name ? uidForName(name) : "", name };
    localStorage.setItem("cc-me", JSON.stringify(m));
    setMe(m);
    setReady(true);
  }, []);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("dispos").select("*").eq("groupe", group);
    if (error) setError(explainError(error.message));
    else { setError(""); setRows(data); }
  }, [group]);

  // Chargement + mises à jour en direct
  useEffect(() => {
    if (!ready || !supabase) return;
    load();
    const channel = supabase
      .channel(`dispos-${group}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "dispos" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ready, group, load]);

  const byDate = useMemo(() => {
    const map = {};
    for (const r of rows) (map[r.date] ||= []).push(r);
    return map;
  }, [rows]);

  const people = useMemo(() => {
    const map = new Map();
    for (const r of rows) map.set(r.user_id, r.name);
    if (me.name) map.set(me.uid, me.name);
    return map;
  }, [rows, me]);

  const okCount = (d) => (byDate[d] || []).filter((e) => e.status === "ok").length;

  const best = useMemo(
    () =>
      Object.keys(byDate)
        .filter((d) => d >= today && okCount(d) > 0)
        .sort((a, b) => okCount(b) - okCount(a) || a.localeCompare(b))
        .slice(0, 5),
    [byDate, today] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // --- Actions ---
  const saveName = (name) => {
    if (!NAMES.includes(name)) return;
    const next = { uid: uidForName(name), name };
    localStorage.setItem("cc-me", JSON.stringify(next));
    setMe(next);
    const then = nameAsk?.then;
    setNameAsk(null);
    if (then) then(next);
  };

  const requireName = (fn) => (me.name ? fn() : setNameAsk({ then: fn }));

  const save = async (dates, status, note) => {
    const n = (note || "").trim();
    const list = dates.map((date) => ({
      groupe: group, date, user_id: me.uid, name: me.name, status,
      note: n ? n.slice(0, 120) : null, updated_at: new Date().toISOString()
    }));
    const { error } = await supabase.from("dispos").upsert(list, { onConflict: "groupe,date,user_id" });
    if (error) setError(explainError(error.message));
    await load();
  };

  const clear = async (dates) => {
    const { error } = await supabase.from("dispos").delete().eq("groupe", group).eq("user_id", me.uid).in("date", dates);
    if (error) setError(explainError(error.message));
    await load();
  };

  const onDay = (date) => {
    if (multi) {
      setSelected((s) => { const n = new Set(s); n.has(date) ? n.delete(date) : n.add(date); return n; });
    } else requireName(() => setOpenDay(date));
  };

  const bulk = async (s) => {
    const dates = [...selected];
    if (s !== "cancel" && dates.length) s === "clear" ? await clear(dates) : await save(dates, s, "");
    setMulti(false);
    setSelected(new Set());
  };

  const changeGroup = () => {
    const g = window.prompt("Nom du groupe (lettres, chiffres, - ou _). Les personnes avec le même nom partagent le même calendrier :", group);
    if (g && g.trim()) window.location.search = "?g=" + encodeURIComponent(g.trim().toLowerCase());
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?g=${group}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt("Copie ce lien :", url); }
  };

  const shift = (delta) => setView(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  if (!ready) return <p className="muted center">Chargement…</p>;

  // --- Rendu du mois ---
  const { y, m } = view;
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const nbDays = new Date(y, m + 1, 0).getDate();
  const title = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(y, m, 1));

  return (
    <>
      <header className="top">
        <div>
          <h1>Calendrier des copains</h1>
          <p className="sub">
            Groupe <strong>{group}</strong> ·{" "}
            <button className="link" type="button" onClick={copyLink}>
              {copied ? "Lien copié !" : "Copier le lien à partager"}
            </button>
          </p>
        </div>
        <div className="top-actions">
          <label className="whoami">
            <span>Moi</span>
            <select
              value={me.name}
              aria-label="Choisir mon prénom"
              onChange={(e) => saveName(e.target.value)}
            >
              <option value="" disabled>
                Qui es-tu ?
              </option>
              {NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button className="chip" type="button" onClick={changeGroup}>Changer de groupe</button>
        </div>
      </header>

      {!supabase && (
        <p className="banner">Supabase n’est pas configuré : ajoute NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</p>
      )}
      {error && <p className="banner error">Erreur : {error}</p>}

      <main className="layout">
        <section className="cal" aria-label="Calendrier">
          <div className="cal-nav">
            <button className="nav-btn" type="button" aria-label="Mois précédent" onClick={() => shift(-1)}>‹</button>
            <h2>{title}</h2>
            <button className="nav-btn" type="button" aria-label="Mois suivant" onClick={() => shift(1)}>›</button>
            <button className="chip push" type="button" onClick={() => { const n = new Date(); setView({ y: n.getFullYear(), m: n.getMonth() }); }}>
              Aujourd’hui
            </button>
            <button
              className="chip"
              type="button"
              aria-pressed={multi}
              onClick={() => { if (multi) { setMulti(false); setSelected(new Set()); } else requireName(() => setMulti(true)); }}
            >
              Choisir plusieurs jours
            </button>
          </div>

          <div className="dow" aria-hidden="true">
            {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((d) => <span key={d}>{d}</span>)}
          </div>

          <div className="grid">
            {Array.from({ length: offset }, (_, i) => <span key={"b" + i} />)}
            {Array.from({ length: nbDays }, (_, i) => {
              const d = i + 1;
              const date = iso(y, m, d);
              const entries = byDate[date] || [];
              const cls = ["day", date === today && "today", date < today && "past", selected.has(date) && "selected"].filter(Boolean).join(" ");
              return (
                <button
                  key={date}
                  type="button"
                  className={cls}
                  style={{ "--heat": people.size ? okCount(date) / people.size : 0 }}
                  aria-label={`${fmtLong(date)} : ${okCount(date)} dispo`}
                  onClick={() => onDay(date)}
                >
                  <span className="num">{d}</span>
                  <span className="dots">
                    {entries.filter((e) => e.status !== "no").map((e) => (
                      <i
                        key={e.user_id}
                        className={"dot" + (e.status === "maybe" ? " ring" : "")}
                        style={{ "--c": colorOf(e.user_id) }}
                        title={`${e.name} : ${STATUS[e.status]}`}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <ul className="legend">
            <li><i className="dot" /> Dispo</li>
            <li><i className="dot ring" /> Peut-être</li>
            <li><i className="swatch" /> Plus le fond est vert, plus il y a de monde</li>
          </ul>
        </section>

        <aside className="side">
          <h2>Meilleurs jours</h2>
          <ol className="best">
            {best.length === 0 && <li className="muted">Aucune dispo pour l’instant. Clique sur un jour pour ajouter la tienne.</li>}
            {best.map((d) => (
              <li key={d}>
                <button className="best-item" type="button" onClick={() => requireName(() => setOpenDay(d))}>
                  <span>{fmtLong(d)}</span>
                  <strong>{okCount(d)}/{people.size}</strong>
                </button>
              </li>
            ))}
          </ol>
          <h2>Le groupe</h2>
          <ul className="people">
            {[...people].map(([uid, name]) => (
              <li key={uid}>
                <i className="dot" style={{ "--c": colorOf(uid) }} /> {name}{uid === me.uid ? " (toi)" : ""}
              </li>
            ))}
          </ul>
        </aside>
      </main>

      {multi && (
        <div className="bulk">
          <span>{selected.size} jour{selected.size > 1 ? "s" : ""} choisi{selected.size > 1 ? "s" : ""}</span>
          <button type="button" onClick={() => bulk("ok")}>Dispo</button>
          <button type="button" onClick={() => bulk("maybe")}>Peut-être</button>
          <button type="button" onClick={() => bulk("no")}>Indispo</button>
          <button type="button" onClick={() => bulk("clear")}>Effacer</button>
          <button type="button" className="ghost" onClick={() => bulk("cancel")}>Annuler</button>
        </div>
      )}

      {openDay && (
        <DayModal
          key={openDay}
          date={openDay}
          entries={byDate[openDay] || []}
          me={me}
          onSave={save}
          onClear={clear}
          onClose={() => setOpenDay(null)}
        />
      )}
      {nameAsk && <NameModal initial={me.name} onSubmit={saveName} onClose={() => setNameAsk(null)} />}
    </>
  );
}

function explainError(message) {
  if (/schema cache|could not find the table/i.test(message)) {
    return `${message}. La table n’existe pas encore : dans Supabase, ouvre SQL Editor, colle le fichier supabase/schema.sql, puis clique sur Run.`;
  }
  return message;
}
