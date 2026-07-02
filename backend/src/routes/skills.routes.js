// src/routes/skills.routes.js
// ─────────────────────────────────────────────────────────────────────────────
//  Árbol de Habilidades por Clase — ForgeVenture
//
//  GET  /api/skills/my-skills   → árbol de la clase + estado del usuario
//  POST /api/skills/unlock      → desbloquear una habilidad (gasta 1 skill point)
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { db }     from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { SKILL_TREES, getTreeForClass, getSkillById } from "../services/skillTree.js";

const router = Router();

// ════════════════════════════════════════════════════════════════════════════
// GET /api/skills/my-skills
// Devuelve: árbol de habilidades de la clase del usuario, con su estado actual
// ════════════════════════════════════════════════════════════════════════════
router.get("/my-skills", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    const userData = userDoc.data();
    const heroClass     = (userData.heroClass || "GUERRERO").toUpperCase();
    const unlockedSkills = userData.unlockedSkills || [];
    const skillPoints   = userData.skillPoints   || 0;
    const userLevel     = userData.level         || 1;

    const tree = getTreeForClass(heroClass);

    // Calcular estado de cada habilidad para el frontend
    const skillsWithState = tree.skills.map(skill => {
      const isUnlocked = unlockedSkills.includes(skill.id);
      const levelOk    = userLevel >= skill.levelReq;
      const prereqsOk  = skill.requires.every(r => unlockedSkills.includes(r));

      let state = "locked";
      if (isUnlocked) state = "unlocked";
      else if (levelOk && prereqsOk) state = "available";
      else if (!levelOk) state = "level_locked";
      else state = "prereq_locked";

      return { ...skill, state };
    });

    return res.json({
      ok: true,
      heroClass,
      tree: {
        label: tree.label,
        color: tree.color,
        icon:  tree.icon,
        lore:  tree.lore,
        skills: skillsWithState,
      },
      unlockedSkills,
      skillPoints,
      userLevel,
    });
  } catch (err) {
    console.error("[skills/my-skills] error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/skills/unlock
// Body: { skillId: "G1" }
// Gasta 1 skill point y desbloquea la habilidad (con validaciones)
// ════════════════════════════════════════════════════════════════════════════
router.post("/unlock", verifyToken, async (req, res) => {
  try {
    const uid     = req.user.uid;
    const { skillId } = req.body;

    if (!skillId || typeof skillId !== "string") {
      return res.status(400).json({ ok: false, message: "skillId requerido" });
    }

    const userRef = db.collection("users").doc(uid);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw Object.assign(new Error("Usuario no encontrado"), { code: 404 });

      const d = snap.data();
      const heroClass      = (d.heroClass || "GUERRERO").toUpperCase();
      const unlockedSkills = d.unlockedSkills || [];
      const skillPoints    = d.skillPoints    || 0;
      const userLevel      = d.level          || 1;

      // Verificar que la habilidad existe en el árbol de la clase
      const skill = getSkillById(heroClass, skillId);
      if (!skill) {
        throw Object.assign(new Error(`Habilidad '${skillId}' no existe en la clase ${heroClass}`), { code: 400 });
      }

      // Ya desbloqueada
      if (unlockedSkills.includes(skillId)) {
        throw Object.assign(new Error("Esta habilidad ya está desbloqueada"), { code: 400 });
      }

      // Verificar nivel mínimo
      if (userLevel < skill.levelReq) {
        throw Object.assign(new Error(`Necesitas nivel ${skill.levelReq} para desbloquear ${skill.name}`), { code: 400 });
      }

      // Verificar prerrequisitos
      const missingPrereq = skill.requires.find(r => !unlockedSkills.includes(r));
      if (missingPrereq) {
        throw Object.assign(new Error(`Debes desbloquear las habilidades previas primero`), { code: 400 });
      }

      // Verificar que tiene skill points
      if (skillPoints < 1) {
        throw Object.assign(new Error("No tienes puntos de habilidad disponibles"), { code: 400 });
      }

      const newUnlocked = [...unlockedSkills, skillId];
      const newPoints   = skillPoints - 1;

      tx.update(userRef, {
        unlockedSkills: newUnlocked,
        skillPoints:    newPoints,
        updatedAt:      new Date().toISOString(),
      });

      // Log en activityLog (outside tx — it's added after commit)
      return { newUnlocked, newPoints, skill, heroClass };
    });

    // Log actividad (fuera de transacción, falla silenciosa)
    db.collection("activityLog").add({
      uid,
      type:      "skill_unlocked",
      icon:      result.skill.icon,
      skillId:   skillId,
      skillName: result.skill.name,
      heroClass: result.heroClass,
      message:   `Desbloqueó "${result.skill.name}"`,
      timestamp: new Date().toISOString(),
    }).catch(err => console.warn("[skills/unlock] log error:", err));

    return res.json({
      ok:            true,
      unlockedSkills: result.newUnlocked,
      skillPoints:    result.newPoints,
      skill: {
        id:   result.skill.id,
        name: result.skill.name,
        icon: result.skill.icon,
        desc: result.skill.desc,
      },
    });
  } catch (err) {
    console.error("[skills/unlock] error:", err);
    const status = err.code === 400 ? 400 : err.code === 404 ? 404 : 500;
    return res.status(status).json({ ok: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// GET /api/skills/all-trees
// Devuelve las definiciones de todos los árboles (para admin / preview)
// ════════════════════════════════════════════════════════════════════════════
router.get("/all-trees", verifyToken, async (req, res) => {
  const trees = Object.fromEntries(
    Object.entries(SKILL_TREES).map(([k, v]) => [
      k,
      { label: v.label, color: v.color, icon: v.icon, lore: v.lore, skillCount: v.skills.length },
    ])
  );
  return res.json({ ok: true, trees });
});

export default router;
